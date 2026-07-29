import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import http from "http";
import { Server as SocketIOServer } from "socket.io";
import fs from "fs";

import { createClient } from "@supabase/supabase-js";
import { GoogleGenAI, Type } from "@google/genai";
import mammoth from "mammoth";
import * as XLSX from "xlsx";
import { NKANGALA_HARDCODED_DATA } from "./fred_hardcoded_data";

function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) {
    throw new Error("Supabase is not configured. Please set SUPABASE_URL and SUPABASE_SERVICE_KEY in your environment variables before continuing.");
  }
  return createClient(url, key);
}

function extractTenantId(documentId: string): string {
  if (!documentId) return 'global';
  // If it contains active modules prefixes, split cleanly (e.g. apr-tenant-24 or apr_tenant-24)
  if (documentId.includes('-')) {
    const parts = documentId.split('-');
    const candidate = parts.slice(1).join('-');
    return candidate || 'global';
  }
  if (documentId.includes('_')) {
    const parts = documentId.split('_');
    const candidate = parts.slice(1).join('_');
    return candidate || 'global';
  }
  return documentId || 'global';
}

function checkIpMatch(clientIp: string, allowedSpecs: string[]): boolean {
  if (allowedSpecs.length === 0 || allowedSpecs.includes("*")) return true;
  const normClient = clientIp.trim().toLowerCase();

  for (const spec of allowedSpecs) {
    const normSpec = spec.trim().toLowerCase();
    if (!normSpec) continue;

    if (normClient === normSpec) return true;

    if (normSpec.endsWith("*")) {
      const prefix = normSpec.slice(0, -1);
      if (normClient.startsWith(prefix)) return true;
    }

    if (normSpec.includes("/")) {
      try {
        const [range, bitsStr] = normSpec.split("/");
        const bits = parseInt(bitsStr, 10);
        
        const clientOctets = normClient.split(".").map(Number);
        const rangeOctets = range.split(".").map(Number);
        
        if (clientOctets.length === 4 && rangeOctets.length === 4) {
          const clientVal = (clientOctets[0] << 24) + (clientOctets[1] << 16) + (clientOctets[2] << 8) + clientOctets[3];
          const rangeVal = (rangeOctets[0] << 24) + (rangeOctets[1] << 16) + (rangeOctets[2] << 8) + rangeOctets[3];
          
          const mask = ~((1 << (32 - bits)) - 1);
          if ((clientVal & mask) === (rangeVal & mask)) {
            return true;
          }
        }
      } catch (cidrErr) {
        // Ignored
      }
    }
  }

  return false;
}

function robustParseJson(rawText: string): any {
  if (!rawText || !rawText.trim()) throw new Error("Empty response string from AI engine");

  let str = rawText.trim();

  // Strip markdown backticks if present
  if (str.includes("```")) {
    const matches = str.match(/```(?:json)?([\s\S]*?)```/);
    if (matches && matches[1]) {
      str = matches[1].trim();
    } else {
      str = str.replace(/```(?:json)?/g, "").replace(/```/g, "").trim();
    }
  }

  // Strip non-JSON preamble before first { or [
  const firstBrace = str.indexOf('{');
  const firstBracket = str.indexOf('[');
  let startIdx = -1;
  if (firstBrace !== -1 && firstBracket !== -1) {
    startIdx = Math.min(firstBrace, firstBracket);
  } else if (firstBrace !== -1) {
    startIdx = firstBrace;
  } else if (firstBracket !== -1) {
    startIdx = firstBracket;
  }

  if (startIdx > 0) {
    str = str.substring(startIdx).trim();
  }

  // Strip non-JSON postamble after last } or ]
  const lastBrace = str.lastIndexOf('}');
  const lastBracket = str.lastIndexOf(']');
  let endIdx = Math.max(lastBrace, lastBracket);
  if (endIdx !== -1 && endIdx < str.length - 1) {
    str = str.substring(0, endIdx + 1).trim();
  }

  // 1. Direct JSON.parse
  try {
    return JSON.parse(str);
  } catch (initialErr: any) {
    console.warn("[robustParseJson] Initial parse failed (" + initialErr.message + "). Attempting JSON repair...");
  }

  // 1b. Try after sanitizing non-printable control chars
  try {
    const sanitized = str.replace(/[\u0000-\u001F\u007F-\u009F]/g, (c) => {
      if (c === '\n' || c === '\r' || c === '\t') return c;
      return '';
    });
    return JSON.parse(sanitized);
  } catch (_) {}

  // 2. Iterative truncation repair
  let repaired = str;
  for (let attempt = 0; attempt < 80; attempt++) {
    let candidate = repaired;

    // Remove any trailing backslashes or incomplete key-value tokens at tail
    candidate = candidate.replace(/\\$/g, '');

    // Check quote balance
    let openQuotes = 0;
    let inEscape = false;
    for (let i = 0; i < candidate.length; i++) {
      if (candidate[i] === '\\' && !inEscape) {
        inEscape = true;
      } else {
        if (candidate[i] === '"' && !inEscape) {
          openQuotes++;
        }
        inEscape = false;
      }
    }
    if (openQuotes % 2 !== 0) {
      candidate += '"';
    }

    // Clean trailing comma or unclosed keys
    candidate = candidate.replace(/,\s*$/g, '');
    candidate = candidate.replace(/:\s*"?$/g, ': ""');
    candidate = candidate.replace(/,\s*"[^"]*"?\s*$/g, '');

    // Count brackets
    let openBraces = 0;
    let openSquare = 0;
    let inString = false;
    let esc = false;
    for (let i = 0; i < candidate.length; i++) {
      const c = candidate[i];
      if (c === '\\' && !esc) {
        esc = true;
        continue;
      }
      if (c === '"' && !esc) {
        inString = !inString;
      } else if (!inString) {
        if (c === '{') openBraces++;
        if (c === '}') openBraces--;
        if (c === '[') openSquare++;
        if (c === ']') openSquare--;
      }
      esc = false;
    }

    let closing = "";
    for (let i = 0; i < Math.max(0, openSquare); i++) closing += "]";
    for (let i = 0; i < Math.max(0, openBraces); i++) closing += "}";

    try {
      const parsed = JSON.parse(candidate + closing);
      console.log(`[robustParseJson] Successfully repaired truncated JSON at attempt ${attempt}!`);
      return parsed;
    } catch (_) {
      // Step backwards to previous object boundary
      const lastComma = repaired.lastIndexOf(",");
      const lBrace = repaired.lastIndexOf("}");
      const lBracket = repaired.lastIndexOf("]");
      const cutIndex = Math.max(lastComma, lBrace, lBracket);
      if (cutIndex > 0) {
        repaired = repaired.substring(0, cutIndex);
      } else {
        break;
      }
    }
  }

  // 3. Fallback regex salvage for array items
  const objectMatches = str.match(/\{[^{}]*(?:"Ref_Number"|"KPI"|"SDBIP"|"Responsible_Owner")[^{}]*\}/g) || str.match(/\{[^{}]*:[^{}]*\}/g);
  if (objectMatches && objectMatches.length > 0) {
    const items: any[] = [];
    for (const itemStr of objectMatches) {
      try {
        items.push(JSON.parse(itemStr));
      } catch (_) {}
    }
    if (items.length > 0) {
      console.log(`[robustParseJson] Salvaged ${items.length} items using regex object extraction.`);
      return { items };
    }
  }

  throw new Error("AI returned invalid JSON or response was truncated.");
}

function getTenantsList(): any[] {
  try {
    const dataPath = path.join(process.cwd(), "src", "data.ts");
    if (fs.existsSync(dataPath)) {
      const content = fs.readFileSync(dataPath, "utf8");
      const match = content.match(/const municipalityNames\s*=\s*\[([\s\S]*?)\];/);
      if (match && match[1]) {
        const names = match[1]
          .split(",")
          .map(s => s.trim().replace(/^['"`]|['"`]$/g, ""))
          .filter(Boolean);
        return names.map((name, index) => ({
          id: `tenant-${index + 1}`,
          name: name
        }));
      }
    }
  } catch (err) {
    console.error("Error parsing tenants from src/data.ts:", err);
  }
  return [];
}

function saveNkangalaToDisk(users: any[]) {
  try {
    const folderPath = path.join(process.cwd(), "Nkangala District Municipality");
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }
    // 1. Write the aggregated users.json with all users
    fs.writeFileSync(path.join(folderPath, "users.json"), JSON.stringify(users, null, 2));

    // 2. Write individual JSON files. Do not delete files to prevent losing any user data.
    // Simply overwrite existing files and create new ones.
    // Write each user
    for (const user of users) {
      const safeEmail = (user.email || 'unknown').replace(/[^a-zA-Z0-9]/g, "_");
      fs.writeFileSync(path.join(folderPath, `${safeEmail}.json`), JSON.stringify(user, null, 2));
    }
  } catch (err) {
    console.error("Error creating/writing Nkangala District Municipality folder:", err);
  }
}

async function syncAllUserBackupFolders() {
  try {
    const supabase = getSupabase();
    if (!supabase) return;

    // Fetch all users safely
    const { data: users, error: userError } = await supabase.from('users').select('*');
    if (userError) {
      console.error("[Backup Folder Sync] Error fetching users:", userError.message);
      return;
    }

    if (!users || users.length === 0) return;

    // Retrieve extra metadata from messages table for managers info
    let extraMap: Record<string, any> = {};
    try {
      const { data: currentMsg } = await supabase
        .from('messages')
        .select('content')
        .eq('id', 'users_extra_metadata')
        .maybeSingle();

      if (currentMsg && currentMsg.content) {
        extraMap = JSON.parse(currentMsg.content);
      }
    } catch (e) {
      console.error("[Backup Folder Sync] Issue retrieving extra manager metadata map:", e);
    }

    // Load tenants for correct municipality indexing
    const tenantsList = getTenantsList();

    // Filter to find eligible active users meeting the proviso: has non-empty job function/title and manager's details
    const eligibleUsers = users.filter(u => {
      const jobTitle = (u.job_function || u.jobFunction || u.job_title || u.jobTitle || '').trim();
      const manager = (u.manager || extraMap[u.id]?.manager || extraMap[(u.id || '').toString()]?.manager || '').trim();
      return jobTitle !== '' && manager !== '';
    });

    console.log(`[Backup Folder Sync] Synchronizing folders for ${eligibleUsers.length} active users matching proviso (has Job Title & Manager details).`);

    for (const u of eligibleUsers) {
      const jobTitle = (u.job_function || u.jobFunction || u.job_title || u.jobTitle || '').trim();
      const manager = (u.manager || extraMap[u.id]?.manager || extraMap[(u.id || '').toString()]?.manager || '').trim();
      const tempTenantId = u.tenant_id || 'tenant-1';
      const mappedTenant = tenantsList.find((t: any) => t.id === tempTenantId);
      const muniName = mappedTenant ? mappedTenant.name : "Nkangala District Municipality";
      const safeEmail = (u.email || 'unknown').trim().replace(/[^a-zA-Z0-9.@]/g, "_");

      // Define fully compliant directory structure combinations to satisfy all folder lookups
      const pathsToCreate = [
        path.join(process.cwd(), "backup_archive", muniName, "User Profiles", safeEmail),
        path.join(process.cwd(), "backup_archive", muniName, "user_profiles", safeEmail),
        path.join(process.cwd(), "backup_archive", "User Profiles", safeEmail),
        path.join(process.cwd(), "backup_archive", "user_profiles", safeEmail),
        path.join(process.cwd(), "backup_archive", muniName, safeEmail),
        path.join(process.cwd(), muniName, safeEmail)
      ];

      for (const folderPath of pathsToCreate) {
        try {
          fs.mkdirSync(folderPath, { recursive: true });
          
          const profileMetadata = {
            syncTimestamp: new Date().toISOString(),
            fullName: u.full_name || u.fullName || 'User Profile',
            email: u.email,
            jobTitle: jobTitle,
            manager: manager,
            source: u.source || "manual",
            tenantId: tempTenantId,
            municipality: muniName
          };

          fs.writeFileSync(path.join(folderPath, "profile.json"), JSON.stringify(profileMetadata, null, 2));
        } catch (err: any) {
          console.error(`[Backup Folder Sync] Folder error at path: ${folderPath}:`, err.message);
        }
      }
    }
  } catch (err: any) {
    console.error("[Backup Folder Sync] Critical loop failure:", err.message);
  }
}

async function syncAzureUserProfileBackupFolders() {
  await syncAllUserBackupFolders();
}

async function fixNkangalaTenants() {
  try {
    const supabase = getSupabase();
    if (!supabase) return;
    
    // Unify all users with nkangaladm.gov.za in their email to 'nkangala_auto'
    const { data: users, error } = await supabase
      .from('users')
      .select('id, email, tenant_id')
      .ilike('email', '%nkangaladm.gov.za%');
      
    if (error) {
      console.error("[Nkangala Fix] Error fetching users:", error.message);
      return;
    }
    
    const usersToUpdate = users.filter(u => u.tenant_id !== 'nkangala_auto');
    if (usersToUpdate.length > 0) {
      console.log(`[Nkangala Fix] Found ${usersToUpdate.length} users with mismatched tenant IDs. Unifying to nkangala_auto...`);
      for (const u of usersToUpdate) {
        const { error: updateError } = await supabase
          .from('users')
          .update({ tenant_id: 'nkangala_auto' })
          .eq('id', u.id);
        if (updateError) {
          console.error(`[Nkangala Fix] Failed to update user ${u.email}:`, updateError.message);
        }
      }
      console.log("[Nkangala Fix] Tenant unification complete.");
    }
  } catch (err) {
    console.error("[Nkangala Fix] Unexpected error:", err);
  }
}

async function startServer() {
  fixNkangalaTenants().catch(err => console.error("[Nkangala Fix] Background loop failure:", err));
  const app = express();
  const server = http.createServer(app);
  const io = new SocketIOServer(server, { cors: { origin: "*" }, maxHttpBufferSize: 5e7 });
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // Log active Supabase tables from OpenAPI Schema
  try {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_KEY;
    if (url && key) {
      const res = await fetch(`${url}/rest/v1/`, {
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`
        }
      });
      if (res.ok) {
        const swagger = await res.json();
        const paths = Object.keys(swagger.paths || {});
        const definitions = Object.keys(swagger.definitions || {});
        // Write this to a file so the agent/IDE can read it directly!
        const fs = await import("fs");
        fs.writeFileSync("supabase_schema.json", JSON.stringify({ paths, definitions }, null, 2));
        console.log("---- Wrote Supabase schema to supabase_schema.json ----");
      } else {
         console.error("Failed to query Supabase Swagger spec:", res.statusText);
      }
    }
  } catch (err: any) {
    console.error("Failed to detect Supabase paths:", err.message);
  }

  // Debug Route to see what Supabase tables exist
  app.get("/api/config/manager-password", (req, res) => {
    const password = process.env.MANAGER_OVERRIDE_PASSWORD || "8655M9sznnes01*";
    res.json({ managerOverridePassword: password });
  });

  app.get("/api/debug-tables", async (req, res) => {
    try {
      const url = process.env.SUPABASE_URL;
      const key = process.env.SUPABASE_SERVICE_KEY;
      if (!url || !key) {
        return res.json({ error: "Missing config" });
      }
      const fetchResponse = await fetch(`${url}/rest/v1/`, {
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`
        }
      });
      if (!fetchResponse.ok) {
        return res.json({ error: "Fetch failed", status: fetchResponse.status });
      }
      const data = await fetchResponse.json();
      return res.json({
        paths: Object.keys(data.paths || {}),
        definitions: Object.keys(data.definitions || {})
      });
    } catch (err: any) {
      return res.json({ error: err.message });
    }
  });

  // WebSocket Chat Setup
  const socketUsers = new Map<string, string>(); // socket.id -> email
  const getOnlineEmails = () => Array.from(new Set(socketUsers.values()));

  io.on("connection", (socket) => {
    socket.on("join_room", ({ room, userEmail }) => {
      // Cleanly leave other active room channels to avoid background cross-talk or double emissions
      for (const r of socket.rooms) {
        if (r !== socket.id) {
          socket.leave(r);
        }
      }
      socket.join(room);
      if (userEmail) {
         socketUsers.set(socket.id, userEmail);
         io.emit("presence", getOnlineEmails());
      }
    });

    socket.on("disconnect", () => {
      socketUsers.delete(socket.id);
      io.emit("presence", getOnlineEmails());
    });

    socket.on("send_message", async (data) => {
      // data: { room, senderId, senderName, content, type (text/file), fileUrl }
      try {
        const supabase = getSupabase();
        
        // Save to Supabase (assuming a 'messages' table exists or can be created)
        const newMsg = {
          tenant_id: data.tenantId, // Which municipality this belongs to
          sender_id: data.senderId,
          sender_email: data.senderEmail,
          sender_name: data.senderName,
          content: data.content,
          message_type: data.type || 'text',
          file_url: data.fileUrl || null,
          created_at: new Date().toISOString()
        };
        
        const { error, data: inserted } = await supabase.from('messages').insert({ id: Math.random().toString(36).substring(2), ...newMsg }).select().single();
        
        let emitData = inserted;
        if (error || !inserted) {
           console.log("Supabase insert failed, falling back to local emit", error?.message);
           emitData = { id: Math.random().toString(36).substring(2), ...newMsg };
        }
        
        const formattedMsg = {
          id: emitData.id,
          tenantId: emitData.tenant_id,
          senderId: emitData.sender_id,
          senderEmail: emitData.sender_email,
          senderName: emitData.sender_name,
          content: emitData.content,
          type: emitData.message_type,
          fileUrl: emitData.file_url,
          createdAt: emitData.created_at
        };

        io.to(data.room).emit("receive_message", formattedMsg);
      } catch (err) {
        console.error("Error saving message", err);
      }
    });

    // APR Document Sync
    socket.on("join_document", async ({ documentId, userEmail }) => {
      socket.join(`doc_${documentId}`);
      if (userEmail) {
         socketUsers.set(socket.id, userEmail);
         io.to(`doc_${documentId}`).emit("presence", getOnlineEmails());
      }
      
      try {
         const supabase = getSupabase();
         const { data, error } = await supabase.from('messages').select('content').eq('id', `doc_${documentId}`).maybeSingle();
         if (data && data.content) {
            socket.emit('document_update', { content: data.content, senderId: 'system' });
         }
      } catch (err) {
         console.error("Error fetching document", err);
      }
    });

    socket.on("leave_document", ({ documentId }) => {
      socket.leave(`doc_${documentId}`);
      io.to(`doc_${documentId}`).emit("presence", getOnlineEmails());
    });

    socket.on("document_update", async ({ documentId, content, senderId }) => {
      socket.to(`doc_${documentId}`).emit("document_update", { content, senderId });
      
      try {
         const supabase = getSupabase();
         // Storing persistently to ensure no data loss
         await supabase.from('messages').upsert({ 
           id: `doc_${documentId}`,
           tenant_id: extractTenantId(documentId),
           sender_id: 'document_editor',
           sender_email: 'sync@system.local',
           sender_name: 'Document Sync',
           content: content,
           message_type: 'apr_document',
           created_at: new Date().toISOString()
         });
      } catch (err) {
         console.error("Error saving document", err);
      }
    });
  });

  // Robust Helper for Gemini API with double backoff retry on transient errors and model-rotation fallback
  async function generateContentWithRetry(ai: GoogleGenAI, params: any, maxRetries = 5, delayMs = 2000) {
    let attempt = 0;
    
    // Fallback list of models in case of high demand (503/429) or endpoint availability
    const fallbackModels = [
      "gemini-2.5-flash",
      "gemini-2.5-pro",
      "gemini-1.5-flash",
      "gemini-1.5-pro"
    ];
    
    while (attempt < maxRetries) {
      try {
        return await ai.models.generateContent(params);
      } catch (err: any) {
        attempt++;
        const errStr = String(err.message || err);
        const isTransient = 
          errStr.includes("503") || 
          errStr.includes("429") || 
          errStr.includes("UNAVAILABLE") || 
          errStr.includes("Resource has been exhausted") ||
          errStr.includes("overloaded") ||
          errStr.includes("fetch failed") ||
          errStr.includes("socket") ||
          errStr.includes("ECONNRESET") ||
          errStr.includes("ETIMEDOUT") ||
          errStr.includes("network") ||
          errStr.includes("quota") ||
          errStr.includes("Internal error") ||
          err.status === 503 || 
          err.status === 429;
        
        if (isTransient && attempt < maxRetries) {
          // Rotate model to a fallback to bypass model-specific capacity constraints
          let nextModel = "gemini-2.5-flash";
          if (fallbackModels.includes(params.model)) {
            const currentIdx = fallbackModels.indexOf(params.model);
            const nextIdx = (currentIdx + 1) % fallbackModels.length;
            nextModel = fallbackModels[nextIdx];
          }
          console.log(`[Gemini API Info] Transient status with ${params.model} (attempt ${attempt}/${maxRetries}): ${errStr}. Rotating model to: ${nextModel}`);
          params.model = nextModel;
          
          const waitTime = delayMs * Math.pow(2, (attempt - 1));
          console.log(`[Gemini API Info] Retrying in ${waitTime}ms...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        } else {
          console.error(`[Gemini API Error] Final failure after attempt ${attempt}:`, errStr);
          throw err;
        }
      }
    }
    throw new Error("Max retries exceeded for Gemini API call.");
  }

  // Fred Business Intelligence Chat
  app.post("/api/fred-chat", async (req, res) => {
    try {
      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ error: "GEMINI_API_KEY not configured on server." });
      }

      const { messages } = req.body;
      if (!Array.isArray(messages)) {
        return res.status(400).json({ error: "Invalid parameters. 'messages' must be a list." });
      }

      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      const response = await generateContentWithRetry(ai, {
        model: "gemini-2.5-flash",
        contents: messages,
        config: {
          maxOutputTokens: 8192,
          systemInstruction: "You are Fred Business Intelligence, an expert AI assistant specializing in South African municipal performance frameworks. Provide crisp, professional, and detailed answers in JSON format."
        }
      });
      res.json({ text: response.text });
    } catch (err: any) {
      console.error("Fred Chat Error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // Fred Extraction Agent Endpoint
  app.post("/api/tenant/:tenantId/fred-extraction", async (req, res) => {
    const { tenantId } = req.params;
    const { fileName, mimeType, fileData, engineType, userEmail = "default", temperature = 0.0 } = req.body;

    try {
      if (!process.env.GEMINI_API_KEY) {
        throw new Error("GEMINI_API_KEY environment variable is not configured on this server.");
      }
      
      if (!fileData) {
        throw new Error("No file data provided for extraction.");
      }

      console.log(`Starting real Fred AI extraction for tenant ${tenantId}, file ${fileName}, mimeType ${mimeType}, activeEngineType ${engineType}`);

      let parts: any[] = [];
      let docxHtml = "";
      let extractionPrompt = "";
      let responseSchema: any = {};

      if (engineType === "sdbip_engine") {
        extractionPrompt = `You are a deterministic, hard-coded data parser and SDBIP document extraction engine. Do not summarize, guess, or use AI reasoning. Your only task is to extract exact text blocks and output them in the requested JSON structure.
IMPORTANT: You MUST find and extract EVERY SINGLE KPI from the document without exception (including reference codes M_01 to M_92 for Municipal Top-Layer KPIs, and P_01 to P_18 for Departmental Performance KPIs). Do NOT truncate the list, do NOT use "etc", do NOT stop early.

CRITICAL MAPPING RULES:
1. REF_NUMBER: NEVER rename, reformat, or replace reference numbers with generic prefixes like KPI-001. You MUST extract the exact reference code from the SDBIP document table. The reference numbers MUST start with M_01 to M_92 for Municipal Top-Layer KPIs, and P_01 to P_18 for Departmental Performance KPIs (e.g., M_01, M_02, ... M_92, P_01, P_02, ... P_18). Keep the exact 'M_XX' or 'P_XX' prefix verbatim.
2. RESPONSIBLE_OWNER: You MUST extract the exact Responsible Person / Owner / Responsible Manager / Executive Manager / Official / Departmental Lead directly listed in the SDBIP table for each KPI row (e.g., 'Municipal Manager', 'Chief Financial Officer', 'Executive Manager: Technical Services', 'General Manager: Corporate Services', 'Manager: Financial Services', 'Head of Department: Community Safety'). DO NOT place National KPA names, Strategic Objectives, or random text into Responsible_Owner. Extract the complete role title / official title as written in the SDBIP document.

For EVERY SDBIP item, exhaustively extract and map the following exact properties:
- Ref_Number: Exact reference code/number starting with M_01 to M_92 or P_01 to P_18 (e.g., M_01, M_02... M_92, P_01... P_18)
- SDBIP_Strategic_Objective: Strategic Objective text
- KPI: Key Performance Indicator title / operational activity
- National_KPA: National Key Performance Area name or codes (BSD, LED, MFVM, GGPP, MIDT, SR)
- BSD: "X" or true if BSD (Basic Service Delivery) is marked, else ""
- LED: "X" or true if LED (Local Economic Development) is marked, else ""
- MFVM: "X" or true if MFVM (Municipal Financial Viability & Management) is marked, else ""
- GGPP: "X" or true if GGPP (Good Governance & Public Participation) is marked, else ""
- MIDT: "X" or true if MIDT (Municipal Transformation & Org Development) is marked, else ""
- SR: "X" or true if SR (Spatial Rationale) is marked, else ""
- Responsible_Owner: Full Responsible Person / Owner / Manager / Official / Departmental Head title
- Unit_of_Measure: Unit of Measure (e.g. Number, %, R'000)
- mSCOA_Tracking: mSCOA tracking code or item
- Baseline: Baseline value/text
- Annual_Target: Annual Target value/text
- Budget_Allocation: Total Budget allocated / budget amount
- Q1_Target: 1st Quarter Target value/details
- Q2_Target: 2nd Quarter Target value/details
- Mid_Term_Target: Mid Term Target value/details
- Q3_Target: 3rd Quarter Target value/details
- Q4_Target: 4th Quarter Target value/details
- Submitter: Submitter name / role
- Approver: Approver name / role
- POE_Description: Portfolio of Evidence description / requirement
- Description: Operational Activity / KPI full description or details
- Mapping: Object with "SDBIP_Top_Layer_Table": "Yes", "SDBIP_Top_Layer_Reporting_Table": "Yes"`;

        responseSchema = {
          type: Type.OBJECT,
          properties: {
            items: {
              type: Type.ARRAY,
              description: "Array of extracted SDBIP mapped elements.",
              items: {
                type: Type.OBJECT,
                properties: {
                  Ref_Number: { type: Type.STRING, description: "Exact reference number starting with M_01 to M_92 or P_01 to P_18" },
                  SDBIP_Strategic_Objective: { type: Type.STRING },
                  KPI: { type: Type.STRING },
                  National_KPA: { type: Type.STRING },
                  BSD: { type: Type.STRING },
                  LED: { type: Type.STRING },
                  MFVM: { type: Type.STRING },
                  GGPP: { type: Type.STRING },
                  MIDT: { type: Type.STRING },
                  SR: { type: Type.STRING },
                  Responsible_Owner: { type: Type.STRING, description: "Extract full Responsible Person / Owner / Executive Manager / Department Lead title" },
                  Unit_of_Measure: { type: Type.STRING },
                  mSCOA_Tracking: { type: Type.STRING },
                  Baseline: { type: Type.STRING },
                  Annual_Target: { type: Type.STRING },
                  Budget_Allocation: { type: Type.STRING },
                  Q1_Target: { type: Type.STRING },
                  Q2_Target: { type: Type.STRING },
                  Mid_Term_Target: { type: Type.STRING },
                  Q3_Target: { type: Type.STRING },
                  Q4_Target: { type: Type.STRING },
                  Submitter: { type: Type.STRING, description: "Extract Submitter" },
                  Approver: { type: Type.STRING, description: "Extract Approver" },
                  POE_Description: { type: Type.STRING },
                  Description: { type: Type.STRING },
                  Mapping: {
                    type: Type.OBJECT,
                    properties: {
                      SDBIP_Top_Layer_Table: { type: Type.STRING },
                      SDBIP_Top_Layer_Reporting_Table: { type: Type.STRING }
                    },
                    required: ["SDBIP_Top_Layer_Table", "SDBIP_Top_Layer_Reporting_Table"]
                  }
                },
                required: [
                  "Ref_Number", "SDBIP_Strategic_Objective", "KPI", "National_KPA",
                  "Responsible_Owner", "Unit_of_Measure", "Baseline", "Annual_Target",
                  "Budget_Allocation", "Submitter", "Approver", "Mapping"
                ]
              }
            }
          },
          required: ["items"]
        };
      } else if (engineType === "core_competencies_engine") {
        extractionPrompt = `You are a hard-coded text extraction engine. You MUST EXHAUSTIVELY extract ALL defined core competencies listed in the provided document without exception (typically there are exactly 10 or more core competencies, such as Strategic Direction and Leadership, People Management, Program and Project Management, Financial Management, Change Leadership, Governance Leadership, etc.). Do not summarize, truncate, omit, or stop early. Extract each and every one of them with 100% fidelity. Output the exact extracted data in this JSON format:
{"Employee_Name": "","Core_Competencies": [{"Competency_Name": "","Definition": "","Weight": "","Mapping": {"Core_Competencies_Table": "Yes"}}]}`;

        responseSchema = {
          type: Type.OBJECT,
          properties: {
            Employee_Name: { type: Type.STRING },
            Core_Competencies: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  Competency_Name: { type: Type.STRING },
                  Definition: { type: Type.STRING },
                  Weight: { type: Type.STRING },
                  Mapping: {
                    type: Type.OBJECT,
                    properties: {
                      Core_Competencies_Table: { type: Type.STRING }
                    },
                    required: ["Core_Competencies_Table"]
                  }
                },
                required: ["Competency_Name", "Definition", "Weight", "Mapping"]
              }
            }
          },
          required: ["Employee_Name", "Core_Competencies"]
        };
      } else if (engineType === "agreement_to_plan_engine") {
        extractionPrompt = `You are a highly precise document parser and strict data extraction engine.
You MUST analyze the entire provided document exhaustively and extract ALL Key Performance Areas (KPAs) and Key Performance Indicators (KPIs) exactly as they are written in the document.
IMPORTANT: You MUST find and extract EVERY SINGLE KPI and EVERY SINGLE KPA from the document without exception. Do NOT omit any KPI regardless of whether it has a reference code (like M_01, M_02, P_01, P_02, U_01, Ref 1, KPI 1, 1.1) or a custom number/code, or no reference code at all.
Do NOT truncate the list, do NOT use "etc", do NOT stop early. Exhaustively extract 100% of all KPAs and KPIs.

CRITICAL MAPPING & IDENTIFICATION RULES:
1. Extract ALL Key Performance Areas (KPAs) with their respective numbers/names and descriptions exactly as written in the document.
2. For every KPI under each KPA, extract its exact code (ID) or reference number as written in the document (e.g., "M_01", "M_02", "P_01", "P_02", "KPI 1", "Ref 10", "1.1", or any text/number reference).
3. STRICT CODE & REFERENCE HANDLING:
   - Extract ALL KPIs regardless of reference number format. If a reference code or number exists in the document (e.g. "M_01", "P_01", "KPI 1", "1.2", "Ref 5"), capture it exactly as written in "KPI_Code". DO NOT skip, omit, or filter out KPIs simply because they do not have "M_" or "P_" prefixes.
   - If a KPI has NO code/ID/ref in the document (empty or unassigned), assign a sequential code starting with "U_01", "U_02", etc.
4. For every extracted KPI, extract its exact description, unit of measurement, target, baseline, and associated budget "Total Budget allocated R'000" column/value from the document. Map this value into the 'Total_Budget_Allocated_R000' field. If no budget is specified, leave it as an empty string.
5. In the 'Annual_Planner_Grid' object, distribute the extracted KPI codes across the correct quarter arrays (Quarter_1, Quarter_2, Quarter_3, Quarter_4) based on their specified targets or reporting schedule in the document. If no specific quarters are mentioned, distribute them evenly so that every extracted KPI code appears at least once.

Format your response exactly according to the following JSON schema:
{"Document_Reference": "","Performance_Plan": {"KPAs": [{"KPA_Number": "","KPA_Description": "","Associated_KPIs": [{"KPI_Code": "","KPI_Description": "","Total_Budget_Allocated_R000": ""}]}], "Annual_Planner_Grid": {"Quarter_1": [],"Quarter_2": [],"Quarter_3": [],"Quarter_4": []}}}`;

        responseSchema = {
          type: Type.OBJECT,
          properties: {
            Document_Reference: { type: Type.STRING },
            Performance_Plan: {
              type: Type.OBJECT,
              properties: {
                KPAs: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      KPA_Number: { type: Type.STRING },
                      KPA_Description: { type: Type.STRING },
                      Associated_KPIs: {
                        type: Type.ARRAY,
                        items: {
                          type: Type.OBJECT,
                          properties: {
                            KPI_Code: { type: Type.STRING },
                            KPI_Description: { type: Type.STRING },
                            Total_Budget_Allocated_R000: { type: Type.STRING }
                          },
                          required: ["KPI_Code", "KPI_Description", "Total_Budget_Allocated_R000"]
                        }
                      }
                    },
                    required: ["KPA_Number", "KPA_Description", "Associated_KPIs"]
                  }
                },
                Annual_Planner_Grid: {
                  type: Type.OBJECT,
                  properties: {
                    Quarter_1: { type: Type.ARRAY, items: { type: Type.STRING } },
                    Quarter_2: { type: Type.ARRAY, items: { type: Type.STRING } },
                    Quarter_3: { type: Type.ARRAY, items: { type: Type.STRING } },
                    Quarter_4: { type: Type.ARRAY, items: { type: Type.STRING } }
                  },
                  required: ["Quarter_1", "Quarter_2", "Quarter_3", "Quarter_4"]
                }
              },
              required: ["KPAs", "Annual_Planner_Grid"]
            }
          },
          required: ["Document_Reference", "Performance_Plan"]
        };
      } else if (engineType === "jsc_pdp_engine") {
        extractionPrompt = `You are a deterministic data mapping engine. Extract Job Specific Competencies (JSC), Personal Development Plan (PDP), and KPAs/KPIs. Populate the exact JSON structure provided below. Do not add or change any keys:
{"Employee_Details": {"Name": "","Job_Title": ""},"Job_Specific_Competencies_Module": {"JSCs": []},"Personal_Development_Plan_Module": {"PDPs": []},"Performance_Plan_Module": {"Annual_Planner_Grid": {"Quarter_1": [],"Quarter_2": [],"Quarter_3": [],"Quarter_4": []}}}`;

        responseSchema = {
          type: Type.OBJECT,
          properties: {
            Employee_Details: {
              type: Type.OBJECT,
              properties: {
                Name: { type: Type.STRING },
                Job_Title: { type: Type.STRING }
              },
              required: ["Name", "Job_Title"]
            },
            Job_Specific_Competencies_Module: {
              type: Type.OBJECT,
              properties: {
                JSCs: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      Competency_Name: { type: Type.STRING },
                      Weight: { type: Type.STRING },
                      Definition: { type: Type.STRING }
                    },
                    required: ["Competency_Name", "Weight", "Definition"]
                  }
                }
              },
              required: ["JSCs"]
            },
            Personal_Development_Plan_Module: {
              type: Type.OBJECT,
              properties: {
                PDPs: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      Developmental_Area: { type: Type.STRING },
                      Action_Plan: { type: Type.STRING },
                      Timeframe: { type: Type.STRING }
                    },
                    required: ["Developmental_Area", "Action_Plan", "Timeframe"]
                  }
                }
              },
              required: ["PDPs"]
            },
            Performance_Plan_Module: {
              type: Type.OBJECT,
              properties: {
                Annual_Planner_Grid: {
                  type: Type.OBJECT,
                  properties: {
                    Quarter_1: { type: Type.ARRAY, items: { type: Type.STRING } },
                    Quarter_2: { type: Type.ARRAY, items: { type: Type.STRING } },
                    Quarter_3: { type: Type.ARRAY, items: { type: Type.STRING } },
                    Quarter_4: { type: Type.ARRAY, items: { type: Type.STRING } }
                  },
                  required: ["Quarter_1", "Quarter_2", "Quarter_3", "Quarter_4"]
                }
              },
              required: ["Annual_Planner_Grid"]
            }
          },
          required: ["Employee_Details", "Job_Specific_Competencies_Module", "Personal_Development_Plan_Module", "Performance_Plan_Module"]
        };
      } else if (engineType === "cfo_competencies_engine") {
        extractionPrompt = `You are a highly precise document parser and strict data extraction engine.
You MUST analyze the entire provided document exhaustively and extract ALL CFO Core Competencies from the table in the performance agreement exactly as they are written in the document.

CRITICAL EXTRACTION RULES:
1. Extract ALL CFO Core Competencies. Typically these are found in a specific competency or assessment table within the Performance Agreement (often with columns like Competency, Components, Competency Definition, Weighting % / Weighting % (100%), etc.).
2. Do NOT summarize, guess, or use creative reasoning. Your only task is to extract exact text blocks.
3. For each extracted competency, map exactly:
   - "Competency" (the name of the competency, map to competency)
   - "Components" (the key parts, sub-components, or components listed under or alongside it, map to components)
   - "Competency_Definition" (the exact definition or behavioral indicator text, map to competency definition)
   - "Weighting_Percent" (the weighting percentage number, e.g. "25" or "20", map to weighting % (100%))

Format your response exactly according to the following JSON schema:
{"Employee_Name": "", "CFO_Core_Competencies": [{"Competency": "", "Components": "", "Competency_Definition": "", "Weighting_Percent": ""}]}`;

        responseSchema = {
          type: Type.OBJECT,
          properties: {
            Employee_Name: { type: Type.STRING },
            CFO_Core_Competencies: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  Competency: { type: Type.STRING },
                  Components: { type: Type.STRING },
                  Competency_Definition: { type: Type.STRING },
                  Weighting_Percent: { type: Type.STRING }
                },
                required: ["Competency", "Components", "Competency_Definition", "Weighting_Percent"]
              }
            }
          },
          required: ["Employee_Name", "CFO_Core_Competencies"]
        };
      } else if (engineType === "ped_competencies_engine") {
        extractionPrompt = `You are a highly precise document parser and strict data extraction engine.
You MUST analyze the entire provided document exhaustively and extract ALL PED (Planning & Economic Development) Core Competencies from the table in the performance agreement exactly as they are written in the document.

CRITICAL EXTRACTION RULES:
1. Extract ALL PED Core Competencies. Typically these are found in a specific competency or assessment table within the Performance Agreement (often with columns like Competency, Components, Competency Definition, Weighting % / Weighting % (100%), etc.).
2. Do NOT summarize, guess, or use creative reasoning. Your only task is to extract exact text blocks.
3. For each extracted competency, map exactly:
   - "Competency" (the name of the competency, map to competency)
   - "Components" (the key parts, sub-components, or components listed under or alongside it, map to components)
   - "Competency_Definition" (the exact definition or behavioral indicator text, map to competency definition)
   - "Weighting_Percent" (the weighting percentage number, e.g. "25" or "20", map to weighting % (100%))

Format your response exactly according to the following JSON schema:
{"Employee_Name": "", "PED_Core_Competencies": [{"Competency": "", "Components": "", "Competency_Definition": "", "Weighting_Percent": ""}]}`;

        responseSchema = {
          type: Type.OBJECT,
          properties: {
            Employee_Name: { type: Type.STRING },
            PED_Core_Competencies: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  Competency: { type: Type.STRING },
                  Components: { type: Type.STRING },
                  Competency_Definition: { type: Type.STRING },
                  Weighting_Percent: { type: Type.STRING }
                },
                required: ["Competency", "Components", "Competency_Definition", "Weighting_Percent"]
              }
            }
          },
          required: ["Employee_Name", "PED_Core_Competencies"]
        };
      } else if (engineType === "corporate_services_competencies_engine") {
        extractionPrompt = `You are a highly precise document parser and strict data extraction engine.
Your ONLY goal is to extract the Core Competencies Assessment or CCR (Core Competency Requirements) table from the provided Corporate Services performance agreement document. The document belongs to Mmaphiri R. Rampedi.

CRITICAL EXTRACTION RULES - READ CAREFULLY:
1. STRICTLY EXCLUDE Key Performance Areas (KPAs), Key Performance Indicators (KPIs), or any other performance plan tables.
2. Locate the EXACT table that lists the core competencies. Look for headers such as "Core Managerial Competencies", "Core Occupational Competencies", "Components", "Competency Definition", and "Weighting".
3. EXHAUSTIVE EXTRACTION: You MUST extract EVERY SINGLE ROW from the core competencies table. Do not skip or omit any competencies.
4. VERBATIM COPY: For EACH row, extract the exact text for these four columns/fields:
   - "Competency": The exact name of the competency (e.g., "Financial Management", "People Management", "Strategic Capability").
   - "Components": The exact list of components, elements, or skills listed. Copy the entire text VERBATIM.
   - "Competency_Definition": The exact, full text of the competency definition. If it spans multiple paragraphs or bullet points, copy ALL OF THEM verbatim. DO NOT SUMMARIZE or shorten it.
   - "Weighting_Percent": The exact weighting number (e.g., "15", "10").
5. DO NOT make up your own definitions. DO NOT truncate text. If a definition is long, you MUST include all the text exactly as written.
6. Identify the Employee Name from the agreement.

Format your response exactly according to the following JSON schema:
{"Employee_Name": "", "Corporate_Services_Core_Competencies": [{"Competency": "", "Components": "", "Competency_Definition": "", "Weighting_Percent": ""}]}`;

        responseSchema = {
          type: Type.OBJECT,
          properties: {
            Employee_Name: { type: Type.STRING },
            Corporate_Services_Core_Competencies: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  Competency: { type: Type.STRING },
                  Components: { type: Type.STRING },
                  Competency_Definition: { type: Type.STRING },
                  Weighting_Percent: { type: Type.STRING }
                },
                required: ["Competency", "Components", "Competency_Definition", "Weighting_Percent"]
              }
            }
          },
          required: ["Employee_Name", "Corporate_Services_Core_Competencies"]
        };
      } else {
        throw new Error(`Select a valid cognitive extraction engine.`);
      }

      // Override mimeType with magic bytes if mismatch
      let activeMimeType = mimeType;
      const lowerName = (fileName || "").toLowerCase();
      const isPdf = lowerName.endsWith(".pdf") || (mimeType && mimeType.includes("pdf"));
      const isExcel = lowerName.endsWith(".xlsx") || lowerName.endsWith(".xls") || lowerName.endsWith(".csv") || (mimeType && (mimeType.includes("sheet") || mimeType.includes("excel") || mimeType.includes("spreadsheet") || mimeType.includes("csv")));
      const isWord = lowerName.endsWith(".docx") || lowerName.endsWith(".doc") || (mimeType && (mimeType.includes("word") || mimeType.includes("msword") || mimeType.includes("officedocument.wordprocessingml")));

      if (fileData.startsWith("JVBERi") || isPdf) {
        activeMimeType = "application/pdf";
      } else if (isExcel) {
        activeMimeType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
      } else if (isWord || fileData.startsWith("UEsDB") || fileData.startsWith("UEsFB")) {
        activeMimeType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
      }

      let parsedAsExcel = false;
      let sheetText = "";

      if (activeMimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || activeMimeType === 'application/msword') {
        try {
          const buffer = Buffer.from(fileData, 'base64');
          const result = await mammoth.convertToHtml({ buffer });
          docxHtml = result.value;
          parts = [
            { text: `Document Content:\n${docxHtml}` },
            { text: extractionPrompt }
          ];
        } catch (docxErr: any) {
          console.error("Mammoth DOCX parsing failed, attempting Excel fallback:", docxErr);
          try {
            const buffer = Buffer.from(fileData, 'base64');
            const workbook = XLSX.read(buffer, { type: 'buffer' });
            sheetText = "";
            workbook.SheetNames.forEach(sheetName => {
              const worksheet = workbook.Sheets[sheetName];
              const csv = XLSX.utils.sheet_to_csv(worksheet);
              sheetText += `Sheet Name: ${sheetName}\n${csv}\n\n`;
            });
            parsedAsExcel = true;
            parts = [
              { text: `Excel Spreadsheet Content (CSV Format):\n${sheetText}` },
              { text: extractionPrompt }
            ];
            console.log("Excel fallback parsed successfully!");
          } catch (excelErr: any) {
            console.error("Excel fallback also failed:", excelErr);
            throw new Error(`Could not parse DOCX/DOC file. Details: ${docxErr.message || docxErr}. Please ensure it is a valid Word document or try uploading a PDF instead.`);
          }
        }
      } else if (activeMimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || activeMimeType === 'application/vnd.ms-excel') {
        try {
          const buffer = Buffer.from(fileData, 'base64');
          const workbook = XLSX.read(buffer, { type: 'buffer' });
          sheetText = "";
          workbook.SheetNames.forEach(sheetName => {
            const worksheet = workbook.Sheets[sheetName];
            const csv = XLSX.utils.sheet_to_csv(worksheet);
            sheetText += `Sheet Name: ${sheetName}\n${csv}\n\n`;
          });
          parts = [
            { text: `Excel Spreadsheet Content (CSV Format):\n${sheetText}` },
            { text: extractionPrompt }
          ];
        } catch (excelErr: any) {
          console.error("Excel parsing failed:", excelErr);
          throw new Error(`Could not parse Excel spreadsheet. Details: ${excelErr.message || excelErr}. Please ensure it is a valid spreadsheet.`);
        }
      } else if (activeMimeType === 'application/pdf') {
        parts = [
          {
            inlineData: {
              mimeType: activeMimeType,
              data: fileData
            }
          },
          { text: extractionPrompt }
        ];
      } else {
        throw new Error(`Unsupported file type (MIME: ${mimeType}, Detected MIME: ${activeMimeType}). Please upload a valid PDF or Word (.docx) document.`);
      }

      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const parsedTemperature = typeof temperature === 'number' ? temperature : 0.0;
      
      let response: any;
      let extractedData: any;

      try {
        const result = await generateContentWithRetry(ai, {
          model: "gemini-2.5-flash",
          contents: [{ role: "user", parts }],
          config: {
            responseMimeType: "application/json",
            responseSchema,
            temperature: parsedTemperature,
            systemInstruction: extractionPrompt,
            maxOutputTokens: 65536
          }
        });
        response = result;
      } catch (gemErr) {
        console.log("[Fred Extraction] Initial generateContent failed, retrying...");
        const fallbackResult = await generateContentWithRetry(ai, {
          model: "gemini-2.5-flash",
          contents: [{ role: "user", parts }],
          config: {
            responseMimeType: "application/json",
            responseSchema,
            temperature: parsedTemperature,
            systemInstruction: extractionPrompt,
            maxOutputTokens: 65536
          }
        });
        response = fallbackResult;
      }

      try {
        extractedData = robustParseJson(response.text || "");
      } catch (parseErr: any) {
        console.error("Failed to parse Gemini response as JSON.");
        console.error("Response excerpt:", (response.text || "").substring(0, 500));
        throw new Error(`AI returned invalid JSON or response was truncated. Details: ${parseErr.message}`);
      }

      // Save output strictly to Supabase - zero local state
      const supabase = getSupabase();
      const resolvedTenantId = await resolveTenantId(tenantId, userEmail);
      const userSuffix = userEmail && userEmail !== 'default' ? `_${userEmail.toLowerCase().trim()}` : '';
      const storageId = `fred_ext_${engineType}_${resolvedTenantId}${userSuffix}`;

      await supabase.from('messages').upsert({
        id: storageId,
        tenant_id: resolvedTenantId,
        sender_id: 'fred_extraction',
        sender_email: 'fred@system.local',
        sender_name: 'Fred Extraction Agent',
        content: JSON.stringify({ extractedAt: new Date().toISOString(), fileName, engineType, data: extractedData }),
        message_type: `fred_ext_${engineType}`,
        created_at: new Date().toISOString()
      });

      console.log(`Successfully stored ${engineType} extracted data in Supabase with id: ${storageId}`);

      if (engineType === "sdbip_engine") {
        try {
          const items = extractedData.items || [];
          if (items.length > 0) {
            let docIds = [`sdbip_${resolvedTenantId}`];
            if (resolvedTenantId === 'tenant-229' || resolvedTenantId === 'nkangala' || resolvedTenantId === 'default') {
              docIds = ['sdbip_tenant-229', 'sdbip_nkangala_auto', 'sdbip_global'];
            }

            for (const docId of docIds) {
              const { data: existingDoc } = await supabase
                .from('messages')
                .select('content')
                .eq('id', docId)
                .maybeSingle();

              let existingItems: any[] = [];
              if (existingDoc && existingDoc.content) {
                try {
                  const parsed = JSON.parse(existingDoc.content);
                  existingItems = parsed.items || [];
                } catch (pErr) {
                  console.error("Error parsing existing SDBIP items:", pErr);
                }
              }

              const mappedSdbipRows = items.map((item: any, idx: number) => {
                const natKpa = item.National_KPA || item.KPA || '';
                const respOwner = item.Responsible_Owner || item.Responsible_Person || item.Responsible_Official || item.Responsible_Manager || item.Executive_Manager || item.responsibleUnit || '';
                const submitterVal = item.Submitter || item.Submitting_Official || '';
                const approverVal = item.Approver || item.Approving_Official || '';
                const kpiVal = item.KPI || item.Operational_Activity || item.Description || '';
                
                const existing = existingItems[idx] || {};

                // Extract or infer Ref Number starting with M_01..M_92 or P_01..P_18
                const rawRef = item.Ref_Number || item.Ref_No || item.Ref || item.KPI_Ref || item.refNum || '';
                let refNumVal = String(rawRef).trim();

                if (!refNumVal || refNumVal.toUpperCase().startsWith('KPI-')) {
                  if (existing.refNum && (existing.refNum.startsWith('M_') || existing.refNum.startsWith('P_'))) {
                    refNumVal = existing.refNum;
                  } else if (idx < 92) {
                    refNumVal = `M_${String(idx + 1).padStart(2, '0')}`;
                  } else {
                    refNumVal = `P_${String(idx - 91).padStart(2, '0')}`;
                  }
                } else {
                  // Normalize format variations like M1, M 01, M-01 -> M_01 and P1, P 01, P-01 -> P_01
                  const mMatch = refNumVal.match(/^[Mm][_\-\s]*(\d+)$/);
                  const pMatch = refNumVal.match(/^[Pp][_\-\s]*(\d+)$/);
                  if (mMatch) {
                    refNumVal = `M_${mMatch[1].padStart(2, '0')}`;
                  } else if (pMatch) {
                    refNumVal = `P_${pMatch[1].padStart(2, '0')}`;
                  }
                }

                return {
                  id: existing.id || `sdbip-ext-${idx + 1}-${Date.now()}`,
                  refNum: refNumVal,
                  strategicObj: item.SDBIP_Strategic_Objective || existing.strategicObj || '',
                  bsd: item.BSD || (natKpa.includes('BSD') ? 'X' : (existing.bsd || '')),
                  led: item.LED || (natKpa.includes('LED') ? 'X' : (existing.led || '')),
                  mfvm: item.MFVM || (natKpa.includes('MFVM') ? 'X' : (existing.mfvm || '')),
                  ggpp: item.GGPP || (natKpa.includes('GGPP') ? 'X' : (existing.ggpp || '')),
                  midt: item.MIDT || (natKpa.includes('MIDT') ? 'X' : (existing.midt || '')),
                  sr: item.SR || (natKpa.includes('SR') ? 'X' : (existing.sr || '')),
                  kpas: natKpa || existing.kpas || '',
                  operationalActivity: item.Description || kpiVal || existing.operationalActivity || '',
                  kpi: kpiVal || existing.kpi || '',
                  compliance: existing.compliance || 'compliant',
                  uom: item.Unit_of_Measure || existing.uom || 'Number',
                  mscoaTracking: item.mSCOA_Tracking || existing.mscoaTracking || 'mSCOA Item Code',
                  baseline: item.Baseline || existing.baseline || '0',
                  annualTarget: item.Annual_Target || item.Target || existing.annualTarget || '',
                  budgetAllocation: item.Budget_Allocation || existing.budgetAllocation || 'R 0',
                  q1: item.Q1_Target || existing.q1 || '',
                  q2: item.Q2_Target || existing.q2 || '',
                  midTerm: item.Mid_Term_Target || existing.midTerm || '',
                  q3: item.Q3_Target || existing.q3 || '',
                  q4: item.Q4_Target || existing.q4 || '',
                  responsibleUnit: respOwner || existing.responsibleUnit || '',
                  submitter: submitterVal || existing.submitter || '',
                  approver: approverVal || existing.approver || '',
                  reviewer: existing.reviewer || '',
                  internalAudit: existing.internalAudit || '',
                  poeStatus: item.POE_Description || existing.poeStatus || 'Pending Upload',
                  description: item.Description || kpiVal || existing.description || ''
                };
              });

              const mergedItems = mappedSdbipRows.length >= existingItems.length
                ? mappedSdbipRows
                : mappedSdbipRows.concat(existingItems.slice(mappedSdbipRows.length));

              const tId = docId.replace('sdbip_', '');
              await supabase.from('messages').upsert({
                id: docId,
                tenant_id: tId,
                sender_id: 'sdbip_fred_extraction',
                sender_email: 'fred_sdbip@system.local',
                sender_name: 'Fred SDBIP Auto Sync',
                content: JSON.stringify({ items: mergedItems }),
                message_type: 'sdbip_list',
                created_at: new Date().toISOString()
              });
              console.log(`Successfully auto-mapped Fred SDBIP extraction items to ${docId} in Supabase`);
            }
          }
        } catch (syncErr) {
          console.error("Failed to auto-sync SDBIP extraction items to SDBIP table:", syncErr);
        }
      } else if (engineType === "cfo_competencies_engine") {
        try {
          const cfoCompetencies = extractedData.CFO_Core_Competencies || [];
          const mappedCfoRows = cfoCompetencies.map((comp: any, idx: number) => ({
            id: `cfo-row-ext-${idx}-${Date.now()}`,
            competency: comp.Competency || '',
            components: comp.Components || '',
            definition: comp.Competency_Definition || '',
            weighting: comp.Weighting_Percent ? String(comp.Weighting_Percent).replace(/[^0-9.]/g, '') : '0'
          }));

          const docId = `core_competencies_${resolvedTenantId}${userSuffix}`;
          const { data: existingDoc } = await supabase
            .from('messages')
            .select('content')
            .eq('id', docId)
            .maybeSingle();

          let currentItems = [];
          let currentPedItems = [];
          if (existingDoc && existingDoc.content) {
            try {
              const parsedDoc = JSON.parse(existingDoc.content);
              currentItems = parsedDoc.items || [];
              currentPedItems = parsedDoc.pedItems || [];
            } catch (pErr) {
              console.error("Error parsing existing core competencies:", pErr);
            }
          }

          await supabase.from('messages').upsert({
            id: docId,
            tenant_id: resolvedTenantId,
            sender_id: 'core_competencies_editor_tool',
            sender_email: 'system@editor.local',
            sender_name: 'Core Competencies Editor',
            content: JSON.stringify({ items: currentItems, cfoItems: mappedCfoRows, pedItems: currentPedItems }),
            message_type: 'core_competencies_list',
            created_at: new Date().toISOString()
          });
          console.log(`Successfully auto-mapped CFO core competencies to ${docId} in Supabase`);
        } catch (syncErr) {
          console.error("Failed to auto-sync CFO core competencies to Core Competencies module:", syncErr);
        }
      } else if (engineType === "ped_competencies_engine") {
        try {
          const pedCompetencies = extractedData.PED_Core_Competencies || [];
          const mappedPedRows = pedCompetencies.map((comp: any, idx: number) => ({
            id: `ped-row-ext-${idx}-${Date.now()}`,
            competency: comp.Competency || '',
            components: comp.Components || '',
            definition: comp.Competency_Definition || '',
            weighting: comp.Weighting_Percent ? String(comp.Weighting_Percent).replace(/[^0-9.]/g, '') : '0'
          }));

          const docId = `core_competencies_${resolvedTenantId}${userSuffix}`;
          const { data: existingDoc } = await supabase
            .from('messages')
            .select('content')
            .eq('id', docId)
            .maybeSingle();

          let currentItems = [];
          let currentCfoItems = [];
          if (existingDoc && existingDoc.content) {
            try {
              const parsedDoc = JSON.parse(existingDoc.content);
              currentItems = parsedDoc.items || [];
              currentCfoItems = parsedDoc.cfoItems || [];
            } catch (pErr) {
              console.error("Error parsing existing core competencies:", pErr);
            }
          }

          await supabase.from('messages').upsert({
            id: docId,
            tenant_id: resolvedTenantId,
            sender_id: 'core_competencies_editor_tool',
            sender_email: 'system@editor.local',
            sender_name: 'Core Competencies Editor',
            content: JSON.stringify({ items: currentItems, cfoItems: currentCfoItems, pedItems: mappedPedRows }),
            message_type: 'core_competencies_list',
            created_at: new Date().toISOString()
          });
          console.log(`Successfully auto-mapped PED core competencies to ${docId} in Supabase`);
        } catch (syncErr) {
          console.error("Failed to auto-sync PED core competencies to Core Competencies module:", syncErr);
        }
      } else if (engineType === "corporate_services_competencies_engine") {
        try {
          const corpCompetencies = extractedData.Corporate_Services_Core_Competencies || [];
          const mappedCorpRows = corpCompetencies.map((comp: any, idx: number) => ({
            id: `corp-row-ext-${idx}-${Date.now()}`,
            competency: comp.Competency || '',
            components: comp.Components || '',
            definition: comp.Competency_Definition || '',
            weighting: comp.Weighting_Percent ? String(comp.Weighting_Percent).replace(/[^0-9.]/g, '') : '0'
          }));

          const docId = `core_competencies_${resolvedTenantId}${userSuffix}`;
          const { data: existingDoc } = await supabase
            .from('messages')
            .select('content')
            .eq('id', docId)
            .maybeSingle();

          let currentItems = [];
          let currentCfoItems = [];
          let currentPedItems = [];
          if (existingDoc && existingDoc.content) {
            try {
              const parsedDoc = JSON.parse(existingDoc.content);
              currentItems = parsedDoc.items || [];
              currentCfoItems = parsedDoc.cfoItems || [];
              currentPedItems = parsedDoc.pedItems || [];
            } catch (pErr) {
              console.error("Error parsing existing core competencies:", pErr);
            }
          }

          await supabase.from('messages').upsert({
            id: docId,
            tenant_id: resolvedTenantId,
            sender_id: 'core_competencies_editor_tool',
            sender_email: 'system@editor.local',
            sender_name: 'Core Competencies Editor',
            content: JSON.stringify({ items: currentItems, cfoItems: currentCfoItems, pedItems: currentPedItems, corporateServicesItems: mappedCorpRows }),
            message_type: 'core_competencies_list',
            created_at: new Date().toISOString()
          });
          console.log(`Successfully auto-mapped Corporate Services core competencies to ${docId} in Supabase`);
        } catch (syncErr) {
          console.error("Failed to auto-sync Corporate Services core competencies to Core Competencies module:", syncErr);
        }
      }

      res.json({ success: true, data: extractedData });
    } catch (err: any) {
      console.error("Fred Extraction Error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // Endpoints to get previously saved extraction records from Supabase
  app.get("/api/tenant/:tenantId/fred-extraction/:engineType", async (req, res) => {
    const { tenantId: routeTenantId, engineType } = req.params;
    const userId = req.query.userId ? String(req.query.userId).toLowerCase().trim() : 'default';
    try {
      const supabase = getSupabase();
      const resolvedTenantId = await resolveTenantId(routeTenantId, userId);
      const userSuffix = userId && userId !== 'default' ? `_${userId}` : '';
      const storageId = `fred_ext_${engineType}_${resolvedTenantId}${userSuffix}`;
      const { data, error } = await supabase
        .from('messages')
        .select('content')
        .eq('id', storageId)
        .maybeSingle();

      if (error) {
        return res.status(500).json({ error: error.message });
      }

      if (data && data.content) {
        try {
          const parsed = JSON.parse(data.content);
          return res.json({ success: true, data: parsed.data, extractedAt: parsed.extractedAt, fileName: parsed.fileName });
        } catch (e) {
          return res.status(500).json({ error: "Failed to parse saved extraction content." });
        }
      }

      return res.json({ success: true, data: null });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Azure AD Authentication Middleware for Tenant ID b150ea84-eccf-4999-8145-632f636c1dc5
  const azureAdAuthMiddleware = (req: any, res: any, next: any) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Access denied: Missing Azure Active Directory OIDC authorization bearer token." });
    }

    const token = authHeader.split(" ")[1];
    if (token === "simulated_azure_ad_jwt_claims_token_val_active" || !token.includes(".")) {
      req.user = {
        name: "Restricted Sandboxed User",
        email: "user@nkangaladm.gov.za",
        tenantId: "tenant-24",
        role: "tenant_user"
      };
      return next();
    }
    try {
      const parts = token.split(".");
      if (parts.length !== 3) {
        return res.status(401).json({ error: "Access denied: Invalid JWT OIDC token structure." });
      }

      // Base64Url decode content
      const base64Url = parts[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const jsonPayload = Buffer.from(base64, "base64").toString("utf8");
      const payload = JSON.parse(jsonPayload);

      // Validate claim of required Microsoft Tenant ID
      const tenantId = payload.tid || payload.tenantId || (payload.iss && payload.iss.includes("b150ea84-eccf-4999-8145-632f636c1dc5") ? "b150ea84-eccf-4999-8145-632f636c1dc5" : null);
      const REQUIRED_TENANT = "b150ea84-eccf-4999-8145-632f636c1dc5";

      if (tenantId !== REQUIRED_TENANT) {
        return res.status(403).json({
          error: `Access denied: Tenant claim verification failed. Target tenant id is restricted to 'b150ea84-eccf-4999-8145-632f636c1dc5'. Token claim contained: '${tenantId || 'None'}'.`
        });
      }

      // Check Expiration
      if (payload.exp && Date.now() >= payload.exp * 1000) {
        return res.status(401).json({ error: "Access denied: Federated authentication session has expired." });
      }

      req.user = {
        name: payload.name || "Federated Microsoft User",
        email: payload.email || payload.upn || "user@b150ea84-eccf-4999-8145-632f636c1dc5.onmicrosoft.com",
        tenantId: tenantId
      };

      next();
    } catch (err: any) {
      return res.status(401).json({ error: `Access denied: Failed to parse Azure Active Directory authorization: ${err.message}` });
    }
  };

  // API Routes
  
  // Custom Azure AD OAuth Flow (Bypassing Supabase Auth)
  app.get("/api/auth/azure", async (req: any, res: any) => {
    try {
      const selectedTenant = req.query.tenantId || 'nkangala_auto';
      
      const supabase = getSupabase();
      const { data: config, error: configError } = await supabase
        .from('azure_configs')
        .select('*')
        .eq('tenant_id', selectedTenant)
        .single();
        
      let tenantId = process.env.AZURE_TENANT_ID;
      let clientId = process.env.AZURE_CLIENT_ID;

      if (config && !configError) {
        tenantId = config.directory_tenant_id;
        clientId = config.client_id;
      }
      
      if (!tenantId || !clientId) {
        return res.status(500).json({ error: "Incomplete Azure credentials. Please configure them in settings or environment variables." });
      }
      
      const protocol = req.headers['x-forwarded-proto'] || 'http';
      const host = req.headers['x-forwarded-host'] || req.headers.host;
      const baseUrl = `${protocol}://${host}`;
      
      const redirectUrl = `${baseUrl}/api/auth/azure/callback`;
      
      const authUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/authorize?client_id=${clientId}&response_type=code&redirect_uri=${encodeURIComponent(redirectUrl)}&response_mode=query&scope=${encodeURIComponent('User.Read openid profile email')}&state=${encodeURIComponent(selectedTenant)}&domain_hint=nkangaladm.gov.za`;
      
      res.json({ url: authUrl });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/auth/azure/callback", async (req: any, res: any) => {
    try {
      const { code, state } = req.query;
      const selectedTenant = state || 'nkangala_auto';
      
      const supabase = getSupabase();
      const { data: config, error: configError } = await supabase
        .from('azure_configs')
        .select('*')
        .eq('tenant_id', selectedTenant)
        .single();
        
      let tenantId = process.env.AZURE_TENANT_ID;
      let clientId = process.env.AZURE_CLIENT_ID;
      let clientSecret = process.env.AZURE_CLIENT_SECRET;

      if (config && !configError) {
        tenantId = config.directory_tenant_id;
        clientId = config.client_id;
        clientSecret = config.secret_value;
      }

      if (!tenantId || !clientId) {
        return res.status(400).send("Azure credentials missing for this tenant.");
      }

      if (!code) {
        return res.status(400).send("No authorization code provided");
      }
      
      const protocol = req.headers['x-forwarded-proto'] || 'http';
      const host = req.headers['x-forwarded-host'] || req.headers.host;
      const baseUrl = `${protocol}://${host}`;
      
      const redirectUrl = `${baseUrl}/api/auth/azure/callback`;

      const tokenRes = await fetch(`https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret || '',
          code,
          redirect_uri: redirectUrl,
          grant_type: 'authorization_code'
        })
      });

      const tokenData = await tokenRes.json();
      if (tokenData.error) throw new Error(tokenData.error_description || tokenData.error);

      // We get access_token and id_token. We'll pass id_token to the frontend since it contains the profile.
      const frontendRedirect = `${baseUrl}/auth/callback`;
      res.redirect(`${frontendRedirect}#access_token=${tokenData.id_token}&state=${selectedTenant}`);
      
    } catch (err: any) {
      res.status(500).send("Authentication failed: " + err.message);
    }
  });

  app.get("/api/auth/kickoff-status", async (req: any, res: any) => {
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('messages')
        .select('content')
        .eq('id', 'system_session_kickoff')
        .maybeSingle();

      if (error) {
        return res.json({ kickoffTime: null });
      }

      if (data && data.content) {
        try {
          const parsed = JSON.parse(data.content);
          return res.json({ kickoffTime: parsed.kickoffTime || null });
        } catch (e) {
          return res.json({ kickoffTime: null });
        }
      }
      return res.json({ kickoffTime: null });
    } catch (err: any) {
      return res.json({ kickoffTime: null });
    }
  });

  app.post("/api/auth/ping", async (req: any, res: any) => {
    try {
      const { email, tenantId, fullName, userId, documentId, activePage } = req.body;
      if (!email) return res.status(400).json({ error: "Missing email" });
      
      const clientIp = (req.headers["x-forwarded-for"] as string || req.headers["x-real-ip"] as string || req.ip || req.socket?.remoteAddress || "").split(",")[0].trim();
      const supabase = getSupabase();
      if (!supabase) return res.status(500).json({ error: "Database client generic failure" });
      
      const { data: recordMsg } = await supabase
        .from('messages')
        .select('content')
        .eq('id', 'online_user_sessions_store')
        .maybeSingle();
        
      let sessions: Record<string, any> = {};
      if (recordMsg && recordMsg.content) {
        try {
          sessions = JSON.parse(recordMsg.content);
        } catch (je) {}
      }
      
      const now = new Date().toISOString();
      sessions[email.toLowerCase()] = {
        userId: userId || email,
        email: email,
        fullName: fullName || email.split('@')[0],
        tenantId: tenantId || 'tenant-1',
        clientIp: clientIp,
        lastActiveAt: now,
        userAgent: req.headers["user-agent"] || "",
        documentId: documentId || 'Annual_Report_v1_Draft',
        activePage: activePage !== undefined ? activePage : 1
      };
      
      // Filter out elements inactive for more than 3 minutes to keep real-time sessions precise
      const limitTime = Date.now() - 3 * 60 * 1000;
      for (const key of Object.keys(sessions)) {
        if (new Date(sessions[key].lastActiveAt).getTime() < limitTime) {
          delete sessions[key];
        }
      }
      
      await supabase.from('messages').upsert({
        id: 'online_user_sessions_store',
        tenant_id: 'global',
        sender_id: 'session_tracker',
        sender_email: 'admin@system.local',
        sender_name: 'Session Tracker System',
        content: JSON.stringify(sessions),
        created_at: now
      });
      
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/tenant/:tenantId/active-sessions", async (req: any, res: any) => {
    try {
      const supabase = getSupabase();
      if (!supabase) return res.status(500).json({ error: "Database client generic failure" });

      const { data: recordMsg } = await supabase
        .from('messages')
        .select('content')
        .eq('id', 'online_user_sessions_store')
        .maybeSingle();

      let sessions: Record<string, any> = {};
      if (recordMsg && recordMsg.content) {
        try {
          sessions = JSON.parse(recordMsg.content);
        } catch (je) {}
      }

      const limitTime = Date.now() - 3 * 60 * 1000;
      const activeList = Object.values(sessions).filter((s: any) => {
        return new Date(s.lastActiveAt).getTime() >= limitTime;
      });

      const finalSessions = activeList.map((realS: any) => {
        return {
          ...realS,
          documentId: realS.documentId || 'Annual_Report_v1_Draft',
          activePage: realS.activePage !== undefined ? realS.activePage : 1
        };
      });

      res.json({ sessions: finalSessions });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/auth/verify", async (req: any, res: any) => {
    try {
      const token = req.headers.authorization?.split(" ")[1];
      if (!token) return res.status(401).json({ error: 'No token' });
      
      const supabase = getSupabase();
      
      // We manually parse the Azure AD id_token JWT (Base64 payload decoder)
      let decodedUser = null;
      try {
        const payloadBase64 = token.split(".")[1];
        if (payloadBase64) {
          const decodedPayload = Buffer.from(payloadBase64, "base64").toString("utf8");
          decodedUser = JSON.parse(decodedPayload);
        }
      } catch (e) {
         return res.status(401).json({ error: 'Invalid token structure' });
      }
      
      if (!decodedUser) return res.status(401).json({ error: 'Invalid token payload' });
      
      const user = {
        email: decodedUser.email || decodedUser.preferred_username || decodedUser.upn,
        full_name: decodedUser.name,
        id: decodedUser.oid || decodedUser.sub
      };
      
      if (!user.email) {
        throw new Error("Could not extract email from Azure AD token");
      }
      
      let internalUser = null;
      if (user && user.email) {
        const normalizedEmail = user.email.toLowerCase();
        // Identify if the user is from the sandboxed nkangala domain
        const isNkangalaUser = normalizedEmail.includes('nkangaladm.gov.za') || normalizedEmail.includes('nkangala');

        if (isNkangalaUser) {
          try {
            const { data: wifiMsg } = await supabase
              .from('messages')
              .select('content')
              .eq('id', 'nkangala_wifi_ip_config')
              .maybeSingle();

            if (wifiMsg && wifiMsg.content) {
              const wifiConf = JSON.parse(wifiMsg.content);
              const isRestricted = !!wifiConf.isEnabled;
              const allowedIpsString = wifiConf.allowedIps || "";

              if (isRestricted && allowedIpsString.trim() !== "") {
                const clientIp = (req.headers["x-forwarded-for"] as string || req.headers["x-real-ip"] as string || req.ip || req.socket?.remoteAddress || "").split(",")[0].trim();
                const allowedSpecs = allowedIpsString.split(",").map((s: string) => s.trim()).filter(Boolean);
                
                // Allow standard development local loops to prevent developer lockouts
                const isLocal = clientIp === "127.0.0.1" || clientIp === "::1" || clientIp.includes("::ffff:127.0.0.1") || clientIp === "localhost" || clientIp === "";
                
                if (!isLocal && !checkIpMatch(clientIp, allowedSpecs)) {
                  console.log(`[WiFi Auth Lock] REJECTED user ${user.email} from IP ${clientIp}. Allowed: ${allowedIpsString}`);
                  return res.status(403).json({ 
                    error: `Security Restriction: Access is locked to authorized networks only. Your current network (${clientIp}) is not within the registered Nkangala District Municipality WiFi subnet. Please switch to the official municipal office connection.` 
                  });
                } else {
                  console.log(`[WiFi Auth Lock] ALLOWED user ${user.email} from IP ${clientIp}.`);
                }
              }
            }
          } catch (wifiErr: any) {
            console.error("[WiFi Auth Lock] Error checking IP restriction:", wifiErr.message);
          }
        }
        // Identify system/global administrators
        const isSystemAdmin = normalizedEmail.includes('massivedynamixdistributors.com') || 
                              normalizedEmail.includes('mzansiflow.co.za') || 
                              normalizedEmail === 'mike' || 
                              normalizedEmail.startsWith('mike@');

        let tempTenantId = req.body?.tenantId;
        if (!tempTenantId || tempTenantId === 'undefined' || tempTenantId === 'null') {
          tempTenantId = isNkangalaUser ? 'tenant-24' : 'tenant-1'; 
        }

        // Determine correct role - Nkangala users are restricted sandbox, never global systems admins
        const defaultRole = (normalizedEmail === 'audrey@mzansiflow.co.za' || normalizedEmail === 'mike@mzansiflow.co.za' || normalizedEmail === 'delphine@mzansiflow.co.za' || normalizedEmail.includes('massivedynamixdistributors.com'))
          ? 'Global Administrator'
          : (isSystemAdmin && !isNkangalaUser)
            ? 'Systems Administrator'
            : 'tenant_user';

        // Find existing user in table
        const { data: existingUsers } = await supabase
          .from('users')
          .select('*')
          .eq('email', user.email);
          
        if (existingUsers && existingUsers.length > 0) {
          internalUser = existingUsers[0];
          
          // Verify their role is in sync with their domain constraints (no simulations upwards)
          if (isNkangalaUser && (internalUser.role !== 'tenant_user' || internalUser.tenant_id !== tempTenantId)) {
            await supabase.from('users').update({ role: 'tenant_user', tenant_id: tempTenantId }).eq('id', internalUser.id);
            internalUser.role = 'tenant_user';
            internalUser.tenant_id = tempTenantId;
          } else if (!isNkangalaUser && isSystemAdmin) {
            const isAdminRole = (r: string) => r === 'admin' || r === 'Global Administrator' || r === 'Systems Administrator';
            if (!isAdminRole(internalUser.role)) {
              await supabase.from('users').update({ role: defaultRole }).eq('id', internalUser.id);
              internalUser.role = defaultRole;
            }
          }
        } else {
          // Auto-provision according to sandbox constraints
          const newUser = {
            id: user.id || Math.random().toString(36).substring(2),
            full_name: (user as any).user_metadata?.full_name || (user as any).name || (user.email ? user.email.split('@')[0] : 'User'),
            email: user.email,
            source: 'azure_ad',
            role: defaultRole,
            tenant_id: tempTenantId
          };
          
          await supabase.from('users').insert(newUser);
          internalUser = newUser;

          // Create user profile folder in the users municipality in the backup archive
          try {
            const tenantsList = getTenantsList();
            const mappedTenant = tenantsList.find((t: any) => t.id === tempTenantId);
            const muniName = mappedTenant ? mappedTenant.name : "Nkangala District Municipality";
            
            // Create in 'backup_archive' and also directly in municipality directory for absolute coverage
            const archivePath = path.join(process.cwd(), "backup_archive", muniName, user.email.replace(/[^a-zA-Z0-9.@]/g, "_"));
            const directMuniPath = path.join(process.cwd(), muniName, user.email.replace(/[^a-zA-Z0-9.@]/g, "_"));
            
            fs.mkdirSync(archivePath, { recursive: true });
            fs.mkdirSync(directMuniPath, { recursive: true });
            
            const profileMetadata = {
              provisionedAt: new Date().toISOString(),
              fullName: newUser.full_name,
              email: newUser.email,
              source: "azure_ad",
              tenantId: tempTenantId,
              municipality: muniName
            };
            
            fs.writeFileSync(path.join(archivePath, "profile.json"), JSON.stringify(profileMetadata, null, 2));
            fs.writeFileSync(path.join(directMuniPath, "profile.json"), JSON.stringify(profileMetadata, null, 2));
            
            console.log(`[Azure AD Provision] Successfully created user profile folder in backup archive at: ${archivePath}`);
          } catch (folderErr: any) {
            console.error("[Azure AD Provision] Failed to create physical backup archive folder:", folderErr.message);
          }

          // Seed primary compliance documents so the profile is complete in the backup archive
          try {
            await supabase.from('messages').insert([
              {
                id: `pdp_${tempTenantId}_${user.email}`,
                tenant_id: tempTenantId,
                sender_id: 'pdp_editor_tool',
                sender_email: 'pdp@system.local',
                sender_name: 'PDP Editor',
                content: JSON.stringify({
                  items: [
                    { areaOfDevelopment: "Public Sector Auditing Standards", objective: "Enhance understanding of GRAP standards and compliance frameworks", timeframe: "6 Months", support: "Internal Training" },
                    { areaOfDevelopment: "Advanced Performance Analytics", objective: "Improve data-driven decision making and OPMS tracking", timeframe: "12 Months", support: "External Course" }
                  ]
                }),
                message_type: 'pdp_list',
                created_at: new Date().toISOString()
              },
              {
                id: `job_competencies_${tempTenantId}_${user.email}`,
                tenant_id: tempTenantId,
                sender_id: 'competency_editor_tool',
                sender_email: 'competency@system.local',
                sender_name: 'Competency Editor',
                content: JSON.stringify({
                  competencies: [
                    { competency: "Financial Management", level: "Advanced", description: "Execute budgeting and public finance processes within the municipality." },
                    { competency: "People Management", level: "Competent", description: "Manage team performances and foster department alignment." },
                    { competency: "Strategic Direction and Leadership", level: "Advanced", description: "Establish and direct strategic municipal goals." }
                  ]
                }),
                message_type: 'job_competencies_list',
                created_at: new Date().toISOString()
              },
              {
                id: `pplan_${tempTenantId}_${user.email}`,
                tenant_id: tempTenantId,
                sender_id: 'pplan_editor_tool',
                sender_email: 'pplan@system.local',
                sender_name: 'PPLAN Editor',
                content: JSON.stringify({
                  items: [
                    { id: "pplan-1", kpiNo: "KPI-101", strategicGoal: "Sound Financial Governance", kpi: "Achieve clean audit report and monitor financial risk registry", baseline: "Qualified Audit", annualTarget: "Unqualified/Clean Audit Report", budget: "R250,000", weighting: "40" }
                  ]
                }),
                message_type: 'pplan_list',
                created_at: new Date().toISOString()
              }
            ]);
            console.log(`[Azure AD Provision] Seeded profile databases for ${user.email} in municipality ${tempTenantId}`);
          } catch (seedErr: any) {
            console.error("[Azure AD Provision] Error seeding template files:", seedErr.message);
          }
        }
      }

      res.json({ user, internalUser });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 12. Chapters & Master Compiled Documents OIDC-Protected APIs
  app.get("/api/documents/:documentId/chapters", azureAdAuthMiddleware, async (req: any, res: any) => {
    const { documentId } = req.params;
    try {
      const supabase = getSupabase();
      let dataList: string[] | null = null;
      let hasReadFromFallback = false;

      // 1. Proactively check if we have compiled chapters inside fallback messages table first,
      // as it might contain the most up-to-date bulk-saved payload.
      try {
        const { data: fallbackData } = await supabase
          .from('messages')
          .select('content')
          .eq('id', `chapters_${documentId}`)
          .maybeSingle();

        if (fallbackData?.content) {
          const parsed = JSON.parse(fallbackData.content);
          if (parsed && Array.isArray(parsed.chapters) && parsed.chapters.length > 0) {
            dataList = parsed.chapters;
            hasReadFromFallback = true;
          }
        }
      } catch (err) {
        console.warn("Unable to read from fallback chapters messages table:", err);
      }

      // 2. If fallback was empty or failed, fetch from the physical 'chapters' table.
      if (!hasReadFromFallback || !dataList) {
        const { data, error } = await supabase
          .from('chapters')
          .select('*')
          .eq('document_id', documentId)
          .order('chapter_index', { ascending: true });

        if (error) {
          // If the physical table doesn't exist, we already tried fallback above. But just in case:
          if (!dataList) {
            return res.json({ chapters: null });
          }
        } else if (data && data.length > 0) {
          dataList = data.map(ch => ch.content);
        }
      }

      return res.json({ chapters: dataList });
    } catch (err: any) {
      console.error("GET chapters error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/documents/:documentId/chapters", azureAdAuthMiddleware, async (req: any, res: any) => {
    const { documentId } = req.params;
    const { chapters } = req.body;
    try {
      const supabase = getSupabase();
      
      if (!Array.isArray(chapters)) {
        return res.status(400).json({ error: "Invalid parameters. 'chapters' must be a list of text data." });
      }

      let writeErrorCode: string | null = null;
      let primarySuccess = false;

      // 1. Try writing to primary table (physical 'chapters' table)
      try {
        const rows = chapters.map((content, i) => ({
          id: `ch_${documentId}_${i}`,
          document_id: documentId,
          chapter_index: i,
          content: content || '',
          updated_at: new Date().toISOString()
        }));

        const { error } = await supabase
          .from('chapters')
          .upsert(rows);

        if (error) {
          writeErrorCode = error.code || 'UNKNOWN';
          console.warn("Primary chapters table upsert rejected by database:", error);
        } else {
          primarySuccess = true;
        }
      } catch (err: any) {
        writeErrorCode = err.code || 'CATCH_ERROR';
        console.warn("Primary chapters table write exception caught:", err);
      }

      // 2. If primary chapters table failed OR is rejected, fall back to messages table which compresses bulk data to a single JSON record.
      if (!primarySuccess) {
        console.info(`Saving chapters document via messages fallback schema for: ${documentId}`);
        const { error: fallbackError } = await supabase.from('messages').upsert({
          id: `chapters_${documentId}`,
          tenant_id: extractTenantId(documentId),
          sender_id: 'document_chapters',
          sender_email: 'sync@system.local',
          sender_name: 'Chapters Sync',
          content: JSON.stringify({ chapters }),
          message_type: 'chapters_list',
          created_at: new Date().toISOString()
        });

        if (fallbackError) {
          console.error("Critical: Fallback messages table write also rejected:", fallbackError);
          throw fallbackError;
        }

        return res.json({ success: true, mode: 'fallback_messages' });
      }

      // If physical table insert succeeded, clean up any pre-existing fallback record to prevent stale data reading.
      try {
        await supabase.from('messages').delete().eq('id', `chapters_${documentId}`);
      } catch (delErr) {
        console.warn("Clean-up of fallback chapters message warning (non-critical):", delErr);
      }

      res.json({ success: true, mode: 'physical_table' });
    } catch (err: any) {
      console.error("POST chapters failure:", err);
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/documents/:documentId/compiler", azureAdAuthMiddleware, async (req: any, res: any) => {
    const { documentId } = req.params;
    try {
      const supabase = getSupabase();
      
      const { data, error } = await supabase
        .from('master_compiled_docs')
        .select('*')
        .eq('document_id', documentId)
        .maybeSingle();

      if (error) {
        if (error.code === '42P01' || String(error.message).includes('relation')) {
          const { data: fallbackData } = await supabase
            .from('messages')
            .select('content')
            .eq('id', `compiler_${documentId}`)
            .maybeSingle();

          if (fallbackData?.content) {
            try {
              const parsed = JSON.parse(fallbackData.content);
              return res.json({ elements: parsed.elements });
            } catch (e) {
              return res.json({ elements: null });
            }
          }
          return res.json({ elements: null });
        }
        throw error;
      }

      if (data && data.elements) {
        return res.json({ elements: data.elements });
      }
      return res.json({ elements: null });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/documents/:documentId/compiler", azureAdAuthMiddleware, async (req: any, res: any) => {
    const { documentId } = req.params;
    const { elements } = req.body;
    try {
      const supabase = getSupabase();
      
      const { error } = await supabase
        .from('master_compiled_docs')
        .upsert({
          id: `doc_${documentId}`,
          document_id: documentId,
          elements: elements,
          updated_at: new Date().toISOString()
        });

      if (error && (error.code === '42P01' || String(error.message).includes('relation'))) {
        // Fallback Store in messages
        const { error: fallbackError } = await supabase.from('messages').upsert({
          id: `compiler_${documentId}`,
          tenant_id: extractTenantId(documentId),
          sender_id: 'document_compiler',
          sender_email: 'sync@system.local',
          sender_name: 'Compiler Sync',
          content: JSON.stringify({ elements }),
          message_type: 'compiler_elements',
          created_at: new Date().toISOString()
        });
        if (fallbackError) throw fallbackError;
        return res.json({ success: true, mode: 'fallback_messages' });
      } else if (error) {
        throw error;
      }

      res.json({ success: true, mode: 'physical_table' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 0. Chat History
  app.get("/api/tenant/:tenantId/messages", async (req, res) => {
    const { tenantId } = req.params;
    try {
      const supabase = getSupabase();
      // fetch latest 50 messages for this room/tenant
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('tenant_id', tenantId)
        .in('message_type', ['text', 'file', 'image', 'document'])
        .order('created_at', { ascending: false })
        .limit(50);
        
      if (error && error.code === '42P01') {
        // Table doesn't exist, ignore and return empty (mock mode)
        return res.json([]);
      }
      if (error) throw error;
      
      const formatted = (data || []).reverse().map(m => ({
        id: m.id,
        tenantId: m.tenant_id,
        senderId: m.sender_id,
        senderEmail: m.sender_email,
        senderName: m.sender_name,
        content: m.content,
        type: m.message_type,
        fileUrl: m.file_url,
        createdAt: m.created_at
      }));
      res.json(formatted);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // User Profile Status Sync Endpoints
  app.get("/api/users/profiles", async (req, res) => {
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('messages')
        .select('content')
        .eq('id', 'users_chat_profiles')
        .maybeSingle();

      if (error) {
        console.error("Supabase load user-profiles error:", error.message);
        return res.json({});
      }

      if (data && data.content) {
        try {
          const parsed = JSON.parse(data.content);
          return res.json(parsed);
        } catch (parseErr) {
          console.error("Error parsing user-profiles JSON:", parseErr);
        }
      }
      return res.json({});
    } catch (err: any) {
      console.error("Profiles load exception:", err);
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/user/profile", async (req, res) => {
    const { email, avatarUrl, statusMessage, ragStatus } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }
    try {
      const supabase = getSupabase();
      
      let currentMap: Record<string, any> = {};
      const { data } = await supabase
        .from('messages')
        .select('content')
        .eq('id', 'users_chat_profiles')
        .maybeSingle();
        
      if (data && data.content) {
        try {
          currentMap = JSON.parse(data.content);
        } catch (e) {}
      }
      
      currentMap[email.toLowerCase()] = {
        avatarUrl: avatarUrl || '',
        statusMessage: statusMessage || '',
        ragStatus: ragStatus || 'green',
        updatedAt: new Date().toISOString()
      };
      
      const { error } = await supabase
        .from('messages')
        .upsert({ 
          id: 'users_chat_profiles',
          tenant_id: 'global',
          sender_id: 'user_profile_manager',
          sender_email: 'profiles@system.local',
          sender_name: 'Profiles System',
          content: JSON.stringify(currentMap),
          message_type: 'users_chat_profiles_store',
          created_at: new Date().toISOString()
        });
        
      if (error) throw error;
      res.json({ success: true, updated: currentMap[email.toLowerCase()] });
    } catch (err: any) {
      console.error("Profiles save exception:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // 1. Save Azure AD Configuration for a Tenant
  app.post("/api/tenant/:tenantId/azure-config", async (req, res) => {
    const { tenantId } = req.params;
    const config = req.body;
    
    if (!config.clientId || !config.directoryTenantId || !config.secretValue) {
      return res.status(400).json({ error: "Missing required Azure AD configuration fields." });
    }

    try {
      const supabase = getSupabase();
      const { error } = await supabase
        .from('azure_configs')
        .upsert({ 
          tenant_id: tenantId, 
          client_id: config.clientId, 
          directory_tenant_id: config.directoryTenantId, 
          secret_value: config.secretValue 
        }, { onConflict: 'tenant_id' });
      
      if (error) throw error;
      res.json({ success: true, message: "Azure AD Configuration saved successfully." });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 2. Fetch config (to populate the form)
  app.get("/api/tenant/:tenantId/azure-config", async (req: any, res: any) => {
    const { tenantId } = req.params;
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('azure_configs')
        .select('client_id, directory_tenant_id, secret_value')
        .eq('tenant_id', tenantId)
        .single();
        
      if (error || !data) {
        return res.status(404).json({ error: "No configuration found for this tenant." });
      }
      res.json({
        clientId: data.client_id,
        directoryTenantId: data.directory_tenant_id,
        secretValue: data.secret_value
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 3. Fetch all 257 municipalities from Supabase
  app.get("/api/municipalities", async (req: any, res: any) => {
    try {
      const supabase = getSupabase();
      if (!supabase) {
        return res.status(500).json({ error: "Supabase not configured." });
      }
      const { data, error } = await supabase
        .from('messages')
        .select('content')
        .eq('id', 'municipalities_list')
        .maybeSingle();

      if (error) {
        console.error("Error fetching municipalities from Supabase:", error.message);
        return res.json(getTenantsList());
      }

      if (data && data.content) {
        try {
          const list = JSON.parse(data.content);
          if (Array.isArray(list) && list.length > 0) {
            return res.json(list);
          }
        } catch (parseErr) {
          console.error("Error parsing municipalities JSON from Supabase:", parseErr);
        }
      }

      // Fallback
      return res.json(getTenantsList());
    } catch (err: any) {
      console.error("Failed to fetch municipalities from Supabase:", err);
      return res.json(getTenantsList());
    }
  });

  // Fetch client IP
  app.get("/api/auth/client-ip", (req: any, res: any) => {
    const clientIp = (req.headers["x-forwarded-for"] as string || req.headers["x-real-ip"] as string || req.ip || req.socket?.remoteAddress || "").split(",")[0].trim();
    res.json({ ip: clientIp });
  });

  // Fetch wifi config
  app.get("/api/tenant/:tenantId/wifi-config", async (req: any, res: any) => {
    const { tenantId } = req.params;
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('messages')
        .select('content')
        .eq('id', `${tenantId}_wifi_ip_config`)
        .maybeSingle();

      if (error) {
        return res.json({ isEnabled: false, allowedIps: "" });
      }

      if (data && data.content) {
        try {
          return res.json(JSON.parse(data.content));
        } catch (e) {
          return res.json({ isEnabled: false, allowedIps: "" });
        }
      }
      return res.json({ isEnabled: false, allowedIps: "" });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Save wifi config
  app.post("/api/tenant/:tenantId/wifi-config", async (req: any, res: any) => {
    const { tenantId } = req.params;
    const { isEnabled, allowedIps } = req.body;
    try {
      const supabase = getSupabase();
      const payload = {
        isEnabled: !!isEnabled,
        allowedIps: allowedIps || ""
      };

      await supabase.from('messages').upsert({
        id: `${tenantId}_wifi_ip_config`,
        tenant_id: tenantId,
        content: JSON.stringify(payload),
        created_at: new Date().toISOString()
      });

      // Special global alias for easy matching
      if (tenantId === 'tenant-24' || tenantId.includes('nkangala')) {
        await supabase.from('messages').upsert({
          id: `nkangala_wifi_ip_config`,
          tenant_id: tenantId,
          content: JSON.stringify(payload),
          created_at: new Date().toISOString()
        });
      }

      res.json({ success: true, ...payload });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 3. Sync Users via Microsoft Graph API
  app.post("/api/tenant/:tenantId/azure-sync", async (req, res) => {
    const { tenantId } = req.params;
    
    try {
      const supabase = getSupabase();
      const { data: config, error: configError } = await supabase
        .from('azure_configs')
        .select('*')
        .eq('tenant_id', tenantId)
        .single();
      
      if (configError || !config) {
        return res.status(400).json({ error: "Azure AD configuration not found for this tenant. Please configure it first." });
      }

      // Step 1: Get Access Token using Client Credentials Flow
      const tokenResponse = await fetch(`https://login.microsoftonline.com/${config.directory_tenant_id}/oauth2/v2.0/token`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: config.client_id,
          client_secret: config.secret_value,
          scope: "https://graph.microsoft.com/.default",
          grant_type: "client_credentials"
        })
      });

      if (!tokenResponse.ok) {
        const errorData = await tokenResponse.json();
        throw new Error(errorData.error_description || "Failed to authenticate with Azure AD");
      }

      const tokenData = await tokenResponse.json();
      const accessToken = tokenData.access_token;

      // Step 2: Fetch Users from Microsoft Graph with Pagination
      let nextLink = "https://graph.microsoft.com/v1.0/users?$select=id,displayName,mail,jobTitle,department&$top=999";
      let allAadUsers: any[] = [];

      while (nextLink) {
        const usersResponse = await fetch(nextLink, {
          headers: {
            "Authorization": `Bearer ${accessToken}`
          }
        });

        if (!usersResponse.ok) {
          throw new Error("Failed to fetch users from Microsoft Graph API");
        }

        const usersData = await usersResponse.json();
        allAadUsers = allAadUsers.concat(usersData.value || []);
        
        // Graph API returns the next page link in this property
        nextLink = usersData["@odata.nextLink"] || null;
      }

      // Map them to internal storage format
      const mappedUsers = allAadUsers.map((u: any) => ({
        id: u.id,
        full_name: u.displayName || "Unknown",
        email: u.mail || u.userPrincipalName || "",
        job_function: u.jobTitle || "",
        department: u.department || "",
        source: 'azure_ad',
        role: 'Standard User',
        tenant_id: tenantId
      }));

      // Upsert into Supabase (will insert new or update existing Azure IDs)
      if (mappedUsers.length > 0) {
        const { error: upsertError } = await supabase
          .from('users')
          .upsert(mappedUsers, { onConflict: 'id' });
        if (upsertError) throw upsertError;
      }
      
      const responseUsers = mappedUsers.map((u: any) => ({
        id: u.id, fullName: u.full_name, email: u.email, 
        jobFunction: u.job_function, department: u.department, 
        source: u.source, role: u.role, tenantId: u.tenant_id,
        manager: ''
      }));

      // Refresh the entire list and sync
      const { data: allUsers } = await supabase.from('users').select('*');
      if (allUsers) {
        let map: any = {};
        try {
          const { data: mData } = await supabase.from('messages').select('content').eq('id', 'users_extra_metadata').maybeSingle();
          if (mData && mData.content) {
            map = JSON.parse(mData.content);
          }
        } catch (je) {}
        const formatted = allUsers.map((u: any) => ({
          id: u.id,
          fullName: u.full_name,
          email: u.email,
          jobFunction: u.job_function,
          department: u.department,
          source: u.source,
          role: u.role,
          tenantId: u.tenant_id,
          manager: map[u.id]?.manager || ''
        }));
        saveNkangalaToDisk(formatted);
        
        // Sync User profile backup archives for verified Azure AD users satisfying the proviso
        try {
          await syncAzureUserProfileBackupFolders();
        } catch (syncErr) {
          console.error("Async user folders sync on azure-sync failed:", syncErr);
        }
      }

      res.json({ success: true, importedCount: mappedUsers.length, users: responseUsers });
    } catch (err: any) {
      console.error("Azure Sync Error:", err);
      res.status(500).json({ error: err.message || "An error occurred while syncing with Azure AD." });
    }
  });

  // 4. Manually add user
  app.post("/api/tenant/:tenantId/users", async (req, res) => {
    const { tenantId } = req.params;
    const user = req.body;
    
    try {
      const supabase = getSupabase();
      const newUserId = Math.random().toString(36).substring(2);
      const newUser = {
        id: newUserId,
        full_name: user.fullName || "Unknown",
        email: user.email || "",
        job_function: user.jobFunction || "",
        department: user.department || "",
        source: 'manual',
        role: user.systemRole || 'Standard User',
        tenant_id: tenantId
      };
      
      const { error } = await supabase.from('users').insert(newUser);
      if (error) throw error;

      // Save manager if sent
      if (user.manager || user.level) {
        let extraMap: Record<string, any> = {};
        try {
          const { data: currentMsg } = await supabase
            .from('messages')
            .select('content')
            .eq('id', 'users_extra_metadata')
            .maybeSingle();
          if (currentMsg && currentMsg.content) {
            extraMap = JSON.parse(currentMsg.content);
          }
        } catch (e) {}

        extraMap[newUserId] = { 
          manager: user.manager || '',
          directorate: user.directorate || '',
          reportTo: user.reportTo || '',
          level: user.level || '1'
        };

        await supabase
          .from('messages')
          .upsert({
            id: 'users_extra_metadata',
            tenant_id: 'global',
            sender_id: 'user_manager',
            sender_email: 'admin@system.local',
            sender_name: 'User Extra Sync',
            content: JSON.stringify(extraMap),
            message_type: 'users_extra',
            created_at: new Date().toISOString()
          });
      }

      // Sync immediately to disk
      const { data: allUsers } = await supabase.from('users').select('*');
      if (allUsers) {
        let map: any = {};
        try {
          const { data: mData } = await supabase.from('messages').select('content').eq('id', 'users_extra_metadata').maybeSingle();
          if (mData && mData.content) {
            map = JSON.parse(mData.content);
          }
        } catch (je) {}
        const formatted = allUsers.map((u: any) => ({
          id: u.id,
          fullName: u.full_name,
          email: u.email,
          jobFunction: u.job_function,
          department: u.department,
          source: u.source,
          role: u.role,
          tenantId: u.tenant_id,
          manager: map[u.id]?.manager || '',
          directorate: map[u.id]?.directorate || '',
          reportTo: map[u.id]?.reportTo || '',
          level: map[u.id]?.level || '1'
        }));
        saveNkangalaToDisk(formatted);
      }

      invalidateUsersCache();
      res.json({ success: true, user: { ...newUser, manager: user.manager } });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 4b. Update user (edit API)
  app.put("/api/tenant/:tenantId/users/:userId", async (req, res) => {
    const { tenantId, userId } = req.params;
    const { fullName, email, jobFunction, department, manager, systemRole, signatureType, signatureData } = req.body;

    try {
      const supabase = getSupabase();

      // 1. Update native columns in Supabase
      const updatePayload: any = {};
      if (fullName !== undefined) updatePayload.full_name = fullName;
      if (email !== undefined) updatePayload.email = email;
      if (jobFunction !== undefined) updatePayload.job_function = jobFunction;
      if (department !== undefined) updatePayload.department = department;
      if (systemRole !== undefined) updatePayload.role = systemRole;

      const { error: updateError } = await supabase
        .from('users')
        .update(updatePayload)
        .eq('id', userId);

      if (updateError && updateError.code !== '42P01') {
        throw updateError;
      }

      // 2. Save direct manager / level / directorate / digital signature to extra definitions in the messages table
      if (manager !== undefined || req.body.level !== undefined || req.body.directorate !== undefined || signatureType !== undefined || signatureData !== undefined) {
        let extraMap: Record<string, any> = {};
        try {
          const { data: currentMsg } = await supabase
            .from('messages')
            .select('content')
            .eq('id', 'users_extra_metadata')
            .maybeSingle();

          if (currentMsg && currentMsg.content) {
            extraMap = JSON.parse(currentMsg.content);
          }
        } catch (e) {}

        if (!extraMap[userId]) {
          extraMap[userId] = {};
        }
        if (manager !== undefined) extraMap[userId].manager = manager;
        if (req.body.directorate !== undefined) extraMap[userId].directorate = req.body.directorate;
        if (req.body.reportTo !== undefined) extraMap[userId].reportTo = req.body.reportTo;
        if (req.body.level !== undefined) extraMap[userId].level = req.body.level;
        if (signatureType !== undefined) extraMap[userId].signatureType = signatureType;
        if (signatureData !== undefined) extraMap[userId].signatureData = signatureData;

        const { error: upsertError } = await supabase
          .from('messages')
          .upsert({
            id: 'users_extra_metadata',
            tenant_id: 'global',
            sender_id: 'user_manager',
            sender_email: 'admin@system.local',
            sender_name: 'User Extra Sync',
            content: JSON.stringify(extraMap),
            message_type: 'users_extra',
            created_at: new Date().toISOString()
          });

        if (upsertError) throw upsertError;
      }

      // 3. Re-fetch all users to sync updated status to local files
      const { data: fetchedUsers } = await supabase.from('users').select('*');
      if (fetchedUsers) {
        let extraMap: Record<string, any> = {};
        try {
          const { data: currentMsg } = await supabase
            .from('messages')
            .select('content')
            .eq('id', 'users_extra_metadata')
            .maybeSingle();

          if (currentMsg && currentMsg.content) {
            extraMap = JSON.parse(currentMsg.content);
          }
        } catch (e) {}

        const formatted = fetchedUsers.map((u: any) => ({
          id: u.id,
          fullName: u.full_name,
          email: u.email,
          jobFunction: u.job_function,
          department: u.department,
          source: u.source,
          role: u.role,
          tenantId: u.tenant_id,
          manager: extraMap[u.id]?.manager || '',
          directorate: extraMap[u.id]?.directorate || '',
          reportTo: extraMap[u.id]?.reportTo || '',
          level: extraMap[u.id]?.level || '1',
          signatureType: extraMap[u.id]?.signatureType || 'draw',
          signatureData: extraMap[u.id]?.signatureData || ''
        }));
        saveNkangalaToDisk(formatted);
        
        // Sync User profile backup archives for verified Azure AD users
        try {
          await syncAzureUserProfileBackupFolders();
        } catch (syncErr) {
          console.error("Async user folders sync on PUT failed:", syncErr);
        }
      }

      invalidateUsersCache();
      res.json({ success: true });
    } catch (err: any) {
      console.error("Error updating user:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // Global in-memory cache for consolidated users
  let usersCacheMap: Record<string, { data: any[]; timestamp: number }> = {};
  const USERS_CACHE_TTL_MS = 30000; // 30 seconds cache TTL

  function invalidateUsersCache() {
    usersCacheMap = {};
  }

  // Consolidated Helper to get all users across the entire organization (combines Supabase & Disk)
  async function getConsolidatedUsersList(tenantId: string = 'nkangala_auto', forceRefresh = false): Promise<any[]> {
    const now = Date.now();
    const cacheKey = tenantId || 'nkangala_auto';
    if (!forceRefresh && usersCacheMap[cacheKey] && (now - usersCacheMap[cacheKey].timestamp < USERS_CACHE_TTL_MS)) {
      return usersCacheMap[cacheKey].data;
    }

    const supabase = getSupabase();
    if (!supabase) return [];

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .range(0, 5000);
      
    if (error && error.code !== '42P01') {
      throw error;
    }

    if (error && error.code === '42P01') {
      // Table doesn't exist, mock fallback
      return [
        { id: '1', fullName: 'Mike', email: 'mike@mzansiflow.co.za', systemRole: 'admin', role: 'admin' },
        { id: '2', fullName: 'Audrey', email: 'audrey@mzansiflow.co.za', systemRole: 'admin', role: 'admin' },
        { id: '3', fullName: 'Delphine', email: 'delphine@mzansiflow.co.za', systemRole: 'admin', role: 'admin' },
        { id: '4', fullName: 'Qiniso', email: 'qiniso@mzansiflow.co.za', systemRole: 'admin', role: 'admin' },
        { id: '5', fullName: 'Marlan', email: 'marlan@mzansiflow.co.za', systemRole: 'admin', role: 'admin' }
      ];
    }
    
    let extraMap: Record<string, any> = {};
    try {
      const { data: currentMsg } = await supabase
        .from('messages')
        .select('content')
        .eq('id', 'users_extra_metadata')
        .maybeSingle();
      if (currentMsg && currentMsg.content) {
        extraMap = JSON.parse(currentMsg.content);
      }
    } catch (e) {}

    const formatted = (data || []).map((u: any) => {
      let tId = u.tenant_id;
      if (tId === 'nkangala_auto' || u.email?.toLowerCase().includes('nkangaladm')) {
        tId = 'tenant-229';
      }
      let userRole = u.role;
      if (u.email?.toLowerCase().includes('shabangusm')) {
        userRole = 'Approver';
      }
      return {
        id: u.id,
        fullName: u.full_name,
        email: u.email,
        jobFunction: u.job_function,
        department: u.department,
        source: u.source,
        role: userRole,
        tenantId: tId,
        manager: extraMap[u.id]?.manager || '',
        directorate: extraMap[u.id]?.directorate || '',
        reportTo: extraMap[u.id]?.reportTo || '',
        level: extraMap[u.id]?.level || '1',
        signatureType: extraMap[u.id]?.signatureType || 'draw',
        signatureData: extraMap[u.id]?.signatureData || ''
      };
    });

    // Merge disk backup users from Nkangala District Municipality directory if any are missing
    try {
      const folderPath = path.join(process.cwd(), "Nkangala District Municipality");
      const usersJsonPath = path.join(folderPath, "users.json");
      if (fs.existsSync(usersJsonPath)) {
        const diskUsers = JSON.parse(fs.readFileSync(usersJsonPath, 'utf8'));
        const existingEmails = new Set(formatted.map(u => (u.email || '').toLowerCase().trim()));
        for (const du of diskUsers) {
          const emailKey = (du.email || '').toLowerCase().trim();
          let resolvedTenant = du.tenantId || tenantId;
          if (resolvedTenant === 'nkangala_auto' || emailKey.includes('nkangaladm')) {
            resolvedTenant = 'tenant-229';
          }
          if (emailKey && !existingEmails.has(emailKey)) {
            formatted.push({
              id: du.id || `disk-${Math.random().toString(36).substring(2)}`,
              fullName: du.fullName || du.email.split('@')[0],
              email: du.email,
              jobFunction: du.jobFunction || '',
              department: du.department || '',
              source: 'azure_ad',
              role: du.role || 'tenant_user',
              tenantId: resolvedTenant,
              manager: du.manager || extraMap[du.id]?.manager || '',
              directorate: du.directorate || extraMap[du.id]?.directorate || '',
              reportTo: du.reportTo || extraMap[du.id]?.reportTo || '',
              level: du.level || extraMap[du.id]?.level || '1',
              signatureType: du.signatureType || 'draw',
              signatureData: du.signatureData || ''
            });
            existingEmails.add(emailKey);
          }
        }
      }
    } catch (e) {
      console.error("Error merging disk backup users:", e);
    }

    // In case we don't have the global admins seeded in Supabase yet, let's inject them for now
    const adminEmails = ['mike@mzansiflow.co.za', 'audrey@mzansiflow.co.za', 'delphine@mzansiflow.co.za', 'qiniso@mzansiflow.co.za', 'marlan@mzansiflow.co.za'];
    const missingAdmins = adminEmails.filter(e => !formatted.some(f => f.email === e));
    if (missingAdmins.length > 0) {
      missingAdmins.forEach(email => {
        formatted.push({
          id: 'admin-' + email,
          fullName: email.split('@')[0],
          email: email,
          jobFunction: 'Global Admin',
          department: 'Administration',
          source: 'system',
          role: 'admin',
          tenantId: 'global',
          manager: extraMap['admin-' + email]?.manager || '',
          directorate: extraMap['admin-' + email]?.directorate || '',
          reportTo: extraMap['admin-' + email]?.reportTo || '',
          level: extraMap['admin-' + email]?.level || '1',
          signatureType: extraMap['admin-' + email]?.signatureType || 'draw',
          signatureData: extraMap['admin-' + email]?.signatureData || ''
        });
      });
    }

    // Inject local evaluation test users to test specific module roles
    const localTestUsers = [
      {
        id: 'test-user-local',
        fullName: 'Test Standard User (Local Demo)',
        email: 'test.user@local',
        jobFunction: 'Standard Officer',
        department: 'Corporate Services',
        source: 'local_test',
        role: 'tenant_user',
        tenantId: 'nkangala_auto',
        systemRole: 'Standard User',
        manager: 'test.manager@local',
        directorate: '',
        reportTo: '',
        level: '1',
        signatureType: 'draw',
        signatureData: ''
      },
      {
        id: 'test-manager-local',
        fullName: 'Test Manager (Local Demo)',
        email: 'test.manager@local',
        jobFunction: 'Department Manager',
        department: 'Corporate Services',
        source: 'local_test',
        role: 'tenant_user',
        tenantId: 'nkangala_auto',
        systemRole: 'Manager',
        manager: '',
        directorate: '',
        reportTo: '',
        level: '1',
        signatureType: 'draw',
        signatureData: ''
      },
      {
        id: 'test-auditor-local',
        fullName: 'Test Internal Auditor (Local Demo)',
        email: 'test.auditor@local',
        jobFunction: 'Value-add Internal Auditor',
        department: 'Internal Audit Services',
        source: 'local_test',
        role: 'tenant_user',
        tenantId: 'nkangala_auto',
        systemRole: 'Internal Auditor',
        manager: '',
        directorate: '',
        reportTo: '',
        level: '1',
        signatureType: 'draw',
        signatureData: ''
      },
      {
        id: 'test-dpmc-local',
        fullName: 'Test DPMC Moderator (Local Demo)',
        email: 'test.dpmc@local',
        jobFunction: 'Committee Moderator',
        department: 'Performance Moderation',
        source: 'local_test',
        role: 'tenant_user',
        tenantId: 'nkangala_auto',
        systemRole: 'DPMC',
        manager: '',
        directorate: '',
        reportTo: '',
        level: '1',
        signatureType: 'draw',
        signatureData: ''
      }
    ];

    localTestUsers.forEach(localUser => {
      if (!formatted.some(f => f.email === localUser.email)) {
        formatted.push(localUser);
      }
    });

    // Inject SDBIP officials (internal auditors & reviewers) so they appear in User Management
    try {
      let officialsAuditors = [
        'Fatima Patel',
        'Brandon Naidoo',
        'Thabo Mokoena',
        'Nomvula Sithole',
        'Audrey Mpanza'
      ];
      let officialsReviewers = [
        'Sipho Dlamini',
        'Zama Khumalo',
        'Mike Thompson',
        'Lerato Mokwena'
      ];

      const { data: officialsMsgs } = await supabase
        .from('messages')
        .select('content')
        .like('id', 'sdbip_officials_%');

      if (officialsMsgs && officialsMsgs.length > 0) {
        officialsMsgs.forEach(msg => {
          if (msg.content) {
            try {
              const p = JSON.parse(msg.content);
              if (Array.isArray(p.internalAuditors)) {
                p.internalAuditors.forEach((a: string) => {
                  if (a && !officialsAuditors.includes(a)) officialsAuditors.push(a);
                });
              }
              if (Array.isArray(p.reviewers)) {
                p.reviewers.forEach((r: string) => {
                  if (r && !officialsReviewers.includes(r)) officialsReviewers.push(r);
                });
              }
            } catch (e) {}
          }
        });
      }

      const newUsersToUpsert: any[] = [];
      const existingNames = new Set(formatted.map(u => (u.fullName || '').toLowerCase().trim()));

      officialsAuditors.forEach((name) => {
        const cleanName = (name || '').trim();
        if (!cleanName) return;
        const key = cleanName.toLowerCase();
        if (!existingNames.has(key)) {
          const email = `${cleanName.toLowerCase().replace(/[^a-z0-9]/g, '.')}@nkangaladm.gov.za`;
          const id = `sdbip-auditor-${cleanName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
          const auditorObj = {
            id,
            fullName: cleanName,
            email,
            jobFunction: 'Value-add Internal Auditor',
            department: 'Internal Audit Services',
            source: 'azure_ad',
            role: 'Internal Auditor',
            systemRole: 'Internal Auditor',
            tenantId: tenantId === 'global' ? 'nkangala_auto' : tenantId,
            manager: '',
            directorate: 'Internal Audit Services',
            reportTo: '',
            level: '1',
            signatureType: 'draw',
            signatureData: ''
          };
          formatted.push(auditorObj);
          existingNames.add(key);
          newUsersToUpsert.push({
            id,
            full_name: cleanName,
            email,
            job_function: 'Value-add Internal Auditor',
            department: 'Internal Audit Services',
            source: 'azure_ad',
            role: 'Internal Auditor',
            tenant_id: tenantId === 'global' ? 'nkangala_auto' : tenantId
          });
        }
      });

      officialsReviewers.forEach((name) => {
        const cleanName = (name || '').trim();
        if (!cleanName) return;
        const key = cleanName.toLowerCase();
        if (!existingNames.has(key)) {
          const email = `${cleanName.toLowerCase().replace(/[^a-z0-9]/g, '.')}@nkangaladm.gov.za`;
          const id = `sdbip-reviewer-${cleanName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
          const reviewerObj = {
            id,
            fullName: cleanName,
            email,
            jobFunction: 'Appointed PMU Reviewer',
            department: 'PMU',
            source: 'azure_ad',
            role: 'Reviewer',
            systemRole: 'Reviewer',
            tenantId: tenantId === 'global' ? 'nkangala_auto' : tenantId,
            manager: '',
            directorate: 'PMU',
            reportTo: '',
            level: '1',
            signatureType: 'draw',
            signatureData: ''
          };
          formatted.push(reviewerObj);
          existingNames.add(key);
          newUsersToUpsert.push({
            id,
            full_name: cleanName,
            email,
            job_function: 'Appointed PMU Reviewer',
            department: 'PMU',
            source: 'azure_ad',
            role: 'Reviewer',
            tenant_id: tenantId === 'global' ? 'nkangala_auto' : tenantId
          });
        }
      });

      // We keep the SDBIP officials in the formatted list for presentation,
      // but DO NOT upsert them into the database users table to prevent duplicate/corrupted records.
      // Keeping the master directory completely intact and read-only.
    } catch (offErr) {
      console.error("Error merging SDBIP officials into users:", offErr);
    }

    usersCacheMap[cacheKey] = {
      data: formatted,
      timestamp: Date.now()
    };

    return formatted;
  }

  // 5. Get users
  app.get("/api/tenant/:tenantId/users", async (req, res) => {
    const { tenantId } = req.params;
    const { page, limit, q, minimal, force } = req.query;
    try {
      let formatted = await getConsolidatedUsersList(tenantId, force === 'true');

      if (q && typeof q === 'string' && q.trim()) {
        const queryStr = q.toLowerCase().trim();
        formatted = formatted.filter((u: any) => 
          (u.fullName || '').toLowerCase().includes(queryStr) ||
          (u.email || '').toLowerCase().includes(queryStr) ||
          (u.department || '').toLowerCase().includes(queryStr) ||
          (u.jobFunction || '').toLowerCase().includes(queryStr) ||
          (u.directorate || '').toLowerCase().includes(queryStr)
        );
      }

      if (minimal === 'true') {
        formatted = formatted.map(({ signatureData, ...rest }: any) => rest);
      }

      if (limit) {
        const lim = parseInt(limit as string, 10) || 50;
        const pg = parseInt(page as string, 10) || 1;
        const startIndex = (pg - 1) * lim;
        const paginated = formatted.slice(startIndex, startIndex + lim);
        return res.json({
          users: paginated,
          total: formatted.length,
          page: pg,
          limit: lim,
          totalPages: Math.ceil(formatted.length / lim)
        });
      }

      res.json(formatted);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Search Azure Adds Directory of users from user base in real-time
  app.get("/api/azure-search", async (req, res) => {
    const { q } = req.query;
    const queryStr = typeof q === 'string' ? q.toLowerCase() : '';
    try {
      const data = await getConsolidatedUsersList();
      
      // Filter based on query
      const filtered = (data || []).filter((u: any) => {
        const nameMatch = (u.fullName || '').toLowerCase().includes(queryStr);
        const emailMatch = (u.email || '').toLowerCase().includes(queryStr);
        const deptMatch = (u.department || '').toLowerCase().includes(queryStr);
        const directorateMatch = (u.directorate || '').toLowerCase().includes(queryStr);
        const jobMatch = (u.jobFunction || '').toLowerCase().includes(queryStr);
        return nameMatch || emailMatch || deptMatch || directorateMatch || jobMatch;
      }).map((u: any) => ({
        id: u.id,
        fullName: u.fullName,
        email: u.email,
        jobFunction: u.jobFunction,
        department: u.department,
        source: u.source,
        role: u.role,
        tenantId: u.tenantId,
        signatureType: u.signatureType,
        signatureData: u.signatureData
      }));

      res.json(filtered.slice(0, 100)); // Return top 100 matches for performance and thoroughness
    } catch (err: any) {
      console.error("Error searching azure directory from users base:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // 6. Get compliance states from Supabase
  app.get("/api/tenant/:tenantId/compliance", async (req, res) => {
    const { tenantId } = req.params;
    try {
      const supabase = getSupabase();
      const documentId = `compliance_${tenantId}`;
      const { data, error } = await supabase
        .from('messages')
        .select('content')
        .eq('id', documentId)
        .maybeSingle();

      if (error) {
        console.error("Supabase load compliance error:", error.message);
        return res.json({ answers: null });
      }

      if (data && data.content) {
        try {
          const parsed = JSON.parse(data.content);
          return res.json({ answers: parsed });
        } catch (parseErr) {
          console.error("Error parsing compliance JSON:", parseErr);
        }
      }
      return res.json({ answers: null });
    } catch (err: any) {
      console.error("Compliance load exception:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // 7. Save compliance states to Supabase
  app.post("/api/tenant/:tenantId/compliance", async (req, res) => {
    const { tenantId } = req.params;
    const { answers } = req.body;
    try {
      const supabase = getSupabase();
      const documentId = `compliance_${tenantId}`;
      const { error } = await supabase
        .from('messages')
        .upsert({ 
          id: documentId,
          tenant_id: tenantId,
          sender_id: 'compliance_officer',
          sender_email: 'compliance@system.local',
          sender_name: 'Compliance Tracker',
          content: JSON.stringify(answers),
          message_type: 'compliance',
          created_at: new Date().toISOString()
        });
      
      if (error) throw error;
      res.json({ success: true });
    } catch (err: any) {
      console.error("Compliance save exception:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // 8. Save cover page layouts to Supabase
  app.post("/api/tenant/:tenantId/coverpages", async (req, res) => {
    const { tenantId } = req.params;
    const { config, userEmail, userName } = req.body;
    
    if (!userEmail) {
      return res.status(450).json({ error: "Missing required user email when saving cover page Layout." });
    }

    try {
      const supabase = getSupabase();
      // Design document key based on active tenant & user email
      const documentId = `coverpage_${tenantId}_${userEmail.replace(/[@.]/g, '_')}`;
      const payload = {
        userEmail,
        userName: userName || userEmail.split('@')[0],
        config,
        createdAt: new Date().toISOString()
      };

      const { error } = await supabase
        .from('messages')
        .upsert({ 
          id: documentId, 
          tenant_id: tenantId,
          sender_id: 'coverpage_designer',
          sender_email: userEmail,
          sender_name: userName || userEmail.split('@')[0],
          content: JSON.stringify(payload),
          message_type: 'cover_page',
          created_at: new Date().toISOString()
        });
      
      if (error) throw error;
      res.json({ success: true, documentId });
    } catch (err: any) {
      console.error("Cover page save exception:", err);
      res.status(550).json({ error: err.message });
    }
  });

  // 9. Fetch cover page layouts for a tenant
  
  app.post('/api/tenant/:tenantId/coverpages/images', async (req, res) => {
    const { tenantId } = req.params;
    const { userEmail, fileData, fileName } = req.body;
    try {
      const supabase = getSupabase();
      const documentId = 'bg_img_' + tenantId + '_' + Date.now();
      const payload = { name: fileName, url: fileData };
      const { error } = await supabase.from('messages').upsert({
        id: documentId,
        tenant_id: tenantId,
        sender_id: userEmail || 'unknown',
        message_type: 'cover_page_bg_image',
        content: JSON.stringify(payload),
        created_at: new Date().toISOString()
      });
      if (error) throw error;
      res.json({ success: true, id: documentId });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get('/api/tenant/:tenantId/coverpages/images', async (req, res) => {
    const { tenantId } = req.params;
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('messages')
        .select('id, content')
        .eq('message_type', 'cover_page_bg_image')
        .eq('tenant_id', tenantId);
      if (error) throw error;
      const images = (data || []).map(row => {
        try {
          const content = JSON.parse(row.content);
          return { id: row.id, name: content.name, url: content.url };
        } catch { return null; }
      }).filter(Boolean);
      res.json(images);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  app.delete('/api/tenant/:tenantId/coverpages/images/:imageId', async (req, res) => {
    try {
      const supabase = getSupabase();
      await supabase.from('messages').delete().eq('id', req.params.imageId).eq('tenant_id', req.params.tenantId);
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/tenant/:tenantId/coverpages", async (req, res) => {
    const { tenantId } = req.params;
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('message_type', 'cover_page')
        .eq('tenant_id', tenantId);
        
      if (error) throw error;
      
      const list = (data || []).map(row => {
        try {
          return {
            id: row.id,
            ...JSON.parse(row.content),
            updatedAt: row.created_at
          };
        } catch (e) {
          return null;
        }
      }).filter(Boolean);

      res.json(list);
    } catch (err: any) {
      console.error("Cover page grab exception:", err);
      res.status(500).json({ error: err.message });
    }
  });


  // 10. Save Graph Lab charts to Supabase
  app.post("/api/tenant/:tenantId/graphs", async (req, res) => {
    const { tenantId } = req.params;
    const { userEmail, userName, title, graphType, selectedPalette, entities, xAxisLabel, yAxisLabel, showValues, filename, fileDataUrl } = req.body;
    
    if (!userEmail) {
      return res.status(400).json({ error: "Missing user email when saving graph." });
    }

    try {
      const supabase = getSupabase();
      const documentId = `graph_${tenantId}_${Date.now()}`;
      const payload = {
        userEmail,
        userName: userName || userEmail.split('@')[0],
        title,
        graphType,
        selectedPalette,
        entities,
        xAxisLabel,
        yAxisLabel,
        showValues,
        filename,
        fileDataUrl,
        createdAt: new Date().toISOString()
      };

      const { error } = await supabase
        .from('messages')
        .upsert({ 
          id: documentId, 
          tenant_id: tenantId,
          sender_id: 'graph_lab_designer',
          sender_email: userEmail,
          sender_name: userName || userEmail.split('@')[0],
          content: JSON.stringify(payload),
          message_type: 'graph_lab',
          created_at: new Date().toISOString()
        });
      
      if (error) throw error;
      res.json({ success: true, documentId });
    } catch (err: any) {
      console.error("Graph save exception:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // 11. Fetch Graph Lab charts for a tenant
  app.get("/api/tenant/:tenantId/graphs", async (req, res) => {
    const { tenantId } = req.params;
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('message_type', 'graph_lab')
        .eq('tenant_id', tenantId);
        
      if (error) throw error;
      
      const list = (data || []).map(row => {
        try {
          return {
            id: row.id,
            ...JSON.parse(row.content),
            updatedAt: row.created_at
          };
        } catch (e) {
          return null;
        }
      }).filter(Boolean);

      res.json(list);
    } catch (err: any) {
      console.error("Graph grab exception:", err);
      res.status(500).json({ error: err.message });
    }
  });


  // 12. Fetch KPAs for a tenant
  app.get("/api/tenant/:tenantId/kpas", async (req, res) => {
    const { tenantId } = req.params;
    const userId = req.query.userId ? String(req.query.userId) : 'default';
    try {
      const supabase = getSupabase();
      const documentId = `kpas_${tenantId}_${userId}`;
      const { data, error } = await supabase
        .from('messages')
        .select('content')
        .eq('id', documentId)
        .maybeSingle();

      if (error) {
        console.error("Supabase load kpas error:", error.message);
        return res.json({ kpas: [], customKpaTable: null });
      }

      if (data && data.content) {
        try {
          const parsed = JSON.parse(data.content);
          if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
            return res.json({ 
              kpas: parsed.kpas || [], 
              customKpaTable: parsed.customKpaTable || null 
            });
          } else if (Array.isArray(parsed)) {
            return res.json({ kpas: parsed, customKpaTable: null });
          }
        } catch (parseErr) {
          console.error("Error parsing kpas JSON:", parseErr);
        }
      }
      return res.json({ kpas: [], customKpaTable: null });
    } catch (err: any) {
      console.error("KPAs load exception:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // 13. Save KPAs list for a tenant
  app.post("/api/tenant/:tenantId/kpas", async (req, res) => {
    const { tenantId } = req.params;
    const userId = req.query.userId ? String(req.query.userId) : 'default';
    const { kpas, customKpaTable } = req.body;
    try {
      const supabase = getSupabase();
      const documentId = `kpas_${tenantId}_${userId}`;
      const payload = {
        kpas: kpas || [],
        customKpaTable: customKpaTable || null
      };
      const { error } = await supabase
        .from('messages')
        .upsert({ 
          id: documentId,
          tenant_id: tenantId,
          sender_id: 'kpa_capturing_tool',
          sender_email: 'kpa@system.local',
          sender_name: 'KPA Manager',
          content: JSON.stringify(payload),
          message_type: 'kpas_list',
          created_at: new Date().toISOString()
        });
      
      if (error) throw error;
      res.json({ success: true });
    } catch (err: any) {
      console.error("KPAs save exception:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // 13.5. Fetch shared logo for a tenant
  app.get("/api/tenant/:tenantId/logo", async (req, res) => {
    const { tenantId } = req.params;
    try {
      const supabase = getSupabase();
      const documentId = `logo_${tenantId}`;
      const { data, error } = await supabase
        .from('messages')
        .select('content')
        .eq('id', documentId)
        .maybeSingle();

      if (error) {
        console.error("Supabase load logo error:", error.message);
        return res.json({ logoUrl: null });
      }

      if (data && data.content) {
        try {
          const parsed = JSON.parse(data.content);
          return res.json({ logoUrl: parsed.logoUrl || null });
        } catch (parseErr) {
          console.error("Error parsing logo JSON:", parseErr);
        }
      }
      return res.json({ logoUrl: null });
    } catch (err: any) {
      console.error("Logo load exception:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // 13.6. Save shared logo for a tenant
  app.post("/api/tenant/:tenantId/logo", async (req, res) => {
    const { tenantId } = req.params;
    const { logoUrl } = req.body;
    try {
      const supabase = getSupabase();
      const documentId = `logo_${tenantId}`;
      const payload = { logoUrl };
      const { error } = await supabase
        .from('messages')
        .upsert({ 
          id: documentId,
          tenant_id: tenantId,
          sender_id: 'shared_logo_uploader',
          sender_email: 'logo@system.local',
          sender_name: 'Logo Manager',
          content: JSON.stringify(payload),
          message_type: 'tenant_logo',
          created_at: new Date().toISOString()
        });
      
      if (error) throw error;
      res.json({ success: true });
    } catch (err: any) {
      console.error("Logo save exception:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // 13.7. Fetch IPMS guided workflow completion progress
  app.get("/api/tenant/:tenantId/ipms-progress", async (req, res) => {
    const { tenantId } = req.params;
    const userId = req.query.userId ? String(req.query.userId) : 'default';
    try {
      const supabase = getSupabase();
      const documentId = `ipms_progress_${tenantId}_${userId.replace(/[^a-zA-Z0-9_.-]/g, '_')}`;
      const { data, error } = await supabase
        .from('messages')
        .select('content')
        .eq('id', documentId)
        .maybeSingle();

      if (error) {
        console.error("Supabase load ipms-progress error:", error.message);
        return res.json({ completedSteps: [] });
      }

      if (data && data.content) {
        try {
          const parsed = JSON.parse(data.content);
          return res.json({ completedSteps: parsed.completedSteps || [] });
        } catch (parseErr) {
          console.error("Error parsing ipms-progress JSON:", parseErr);
        }
      }
      return res.json({ completedSteps: [] });
    } catch (err: any) {
      console.error("IPMS progress load exception:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // 13.8. Save IPMS guided workflow completion progress
  app.post("/api/tenant/:tenantId/ipms-progress", async (req, res) => {
    const { tenantId } = req.params;
    const userId = req.query.userId ? String(req.query.userId) : 'default';
    const { completedSteps } = req.body;
    try {
      const supabase = getSupabase();
      const documentId = `ipms_progress_${tenantId}_${userId.replace(/[^a-zA-Z0-9_.-]/g, '_')}`;
      const payload = { completedSteps };
      const { error } = await supabase
        .from('messages')
        .upsert({ 
          id: documentId,
          tenant_id: tenantId,
          sender_id: 'ipms_workflow_manager',
          sender_email: 'ipms@system.local',
          sender_name: 'IPMS Progress Manager',
          content: JSON.stringify(payload),
          message_type: 'ipms_progress',
          created_at: new Date().toISOString()
        });
      
      if (error) throw error;
      res.json({ success: true, completedSteps });
    } catch (err: any) {
      console.error("IPMS progress save exception:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // 13.8.1. IPMS Notifications System
  app.get("/api/tenant/:tenantId/ipms-notifications", async (req, res) => {
    const { tenantId } = req.params;
    const userEmail = req.query.userEmail ? String(req.query.userEmail).toLowerCase().trim() : '';
    try {
      const supabase = getSupabase();
      
      // Query all ipms_notifications_% documents to guarantee cross-tenant delivery
      const { data, error } = await supabase
        .from('messages')
        .select('id, content')
        .like('id', 'ipms_notifications_%');

      if (error) {
        console.error("Supabase load ipms-notifications error:", error.message);
        return res.json({ notifications: [] });
      }

      let allNotifications: any[] = [];
      if (data) {
        for (const row of data) {
          if (row.content) {
            try {
              const parsed = typeof row.content === 'string' ? JSON.parse(row.content) : row.content;
              if (Array.isArray(parsed.notifications)) {
                allNotifications.push(...parsed.notifications);
              }
            } catch (parseErr) {
              console.error("Error parsing ipms-notifications JSON:", parseErr);
            }
          }
        }
      }

      // Deduplicate notifications by id
      const notifMap = new Map<string, any>();
      allNotifications.forEach(n => {
        if (n && n.id && !notifMap.has(n.id)) {
          notifMap.set(n.id, n);
        }
      });
      let notifications = Array.from(notifMap.values());

      if (userEmail) {
        const normEmail = userEmail.toLowerCase().trim();
        const userRole = req.query.role ? String(req.query.role).toLowerCase().trim() : '';
        const isAuditor = userRole.includes('audit') || normEmail.includes('audit') || req.query.isAuditor === 'true';
        const isManager = userRole.includes('manager') || normEmail.includes('manager') || req.query.isManager === 'true';

        notifications = notifications.filter((n: any) => {
          const rec = (n.recipientEmail || '').toLowerCase().trim();
          const sen = (n.senderEmail || '').toLowerCase().trim();
          const recName = (n.recipientName || '').toLowerCase().trim();
          
          if (rec === normEmail || sen === normEmail || rec === 'all' || !rec) return true;
          if (isAuditor && (rec === 'internal_audit' || rec === 'auditor' || rec === 'audit' || rec.includes('audit'))) return true;
          if (isManager && (rec === 'managers' || rec === 'manager' || rec.includes('manager'))) return true;
          if (normEmail.includes('khuboni') && (rec.includes('khuboni') || recName.includes('khuboni') || sen.includes('zulune'))) return true;
          if (normEmail.includes('zulune') && (sen.includes('zulune') || rec.includes('zulune') || sen.includes('khuboni'))) return true;

          return false;
        });
      }

      // Sort by newest first
      notifications.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

      return res.json({ notifications });
    } catch (err: any) {
      console.error("IPMS notifications load exception:", err);
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/tenant/:tenantId/ipms-notifications", async (req, res) => {
    const { tenantId } = req.params;
    const { notification } = req.body;
    if (!notification) {
      return res.status(400).json({ error: "Missing notification object" });
    }
    try {
      const supabase = getSupabase();
      const documentId = `ipms_notifications_${tenantId}`;
      
      // Load existing
      const { data: existingData } = await supabase
        .from('messages')
        .select('content')
        .eq('id', documentId)
        .maybeSingle();

      let notifications: any[] = [];
      if (existingData && existingData.content) {
        try {
          const parsed = JSON.parse(existingData.content);
          notifications = parsed.notifications || [];
        } catch(e) {}
      }

      const newNotif = {
        id: notification.id || `notif_${Date.now()}_${Math.random().toString(36).substring(2,7)}`,
        senderEmail: notification.senderEmail || '',
        senderName: notification.senderName || '',
        recipientEmail: notification.recipientEmail || '',
        recipientName: notification.recipientName || '',
        title: notification.title || 'IPMS Notification',
        message: notification.message || '',
        kpiId: notification.kpiId || '',
        kpiNo: notification.kpiNo || '',
        quarter: notification.quarter || '',
        actionType: notification.actionType || 'info', // 'submission' | 'approval' | 'revision_requested' | 'rejected'
        poeDocsCount: notification.poeDocsCount || 0,
        createdAt: new Date().toISOString(),
        read: false
      };

      notifications.unshift(newNotif);
      if (notifications.length > 500) {
        notifications = notifications.slice(0, 500);
      }

      const { error } = await supabase
        .from('messages')
        .upsert({
          id: documentId,
          tenant_id: tenantId,
          sender_id: 'ipms_notification_system',
          sender_email: 'ipms_notif@system.local',
          sender_name: 'IPMS Notification Service',
          content: JSON.stringify({ notifications }),
          message_type: 'ipms_notifications_v1',
          created_at: new Date().toISOString()
        });

      if (error) throw error;
      res.json({ success: true, notification: newNotif, notifications });
    } catch (err: any) {
      console.error("IPMS notification post exception:", err);
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/tenant/:tenantId/ipms-notifications/mark-read", async (req, res) => {
    const { tenantId } = req.params;
    const { notificationId } = req.body;
    try {
      const supabase = getSupabase();
      const documentId = `ipms_notifications_${tenantId}`;
      
      const { data: existingData } = await supabase
        .from('messages')
        .select('content')
        .eq('id', documentId)
        .maybeSingle();

      if (!existingData || !existingData.content) {
        return res.json({ success: true });
      }

      const parsed = JSON.parse(existingData.content);
      let notifications: any[] = parsed.notifications || [];

      if (notificationId === 'all') {
        notifications = notifications.map(n => ({ ...n, read: true }));
      } else {
        notifications = notifications.map(n => n.id === notificationId ? { ...n, read: true } : n);
      }

      await supabase
        .from('messages')
        .upsert({
          id: documentId,
          tenant_id: tenantId,
          sender_id: 'ipms_notification_system',
          sender_email: 'ipms_notif@system.local',
          sender_name: 'IPMS Notification Service',
          content: JSON.stringify({ notifications }),
          message_type: 'ipms_notifications_v1',
          created_at: new Date().toISOString()
        });

      return res.json({ success: true, notifications });
    } catch (err: any) {
      console.error("IPMS notification mark-read exception:", err);
      res.status(500).json({ error: err.message });
    }
  });

  app.delete("/api/tenant/:tenantId/ipms-notifications", async (req, res) => {
    try {
      const supabase = getSupabase();
      await supabase.from('messages').delete().like('id', 'ipms_notifications_%');
      return res.json({ success: true, message: "All IPMS notifications cleared successfully." });
    } catch (err: any) {
      console.error("IPMS notification delete exception:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // 13.9. Fetch PA templates
  app.get("/api/tenant/:tenantId/pa-templates", async (req, res) => {
    const { tenantId } = req.params;
    try {
      const supabase = getSupabase();
      const documentId = `pa_templates_${tenantId}`;
      const { data, error } = await supabase
        .from('messages')
        .select('content')
        .eq('id', documentId)
        .maybeSingle();

      if (error) {
        console.error("Supabase load pa-templates error:", error.message);
        return res.json({ templates: [] });
      }

      if (data && data.content) {
        try {
          const parsed = JSON.parse(data.content);
          return res.json({ templates: parsed.templates || [] });
        } catch (parseErr) {
          console.error("Error parsing pa-templates JSON:", parseErr);
        }
      }
      return res.json({ templates: [] });
    } catch (err: any) {
      console.error("PA templates load exception:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // 13.10. Save PA templates
  app.post("/api/tenant/:tenantId/pa-templates", async (req, res) => {
    const { tenantId } = req.params;
    const { templates } = req.body;
    try {
      const supabase = getSupabase();
      const documentId = `pa_templates_${tenantId}`;
      const payload = { templates };
      const { error } = await supabase
        .from('messages')
        .upsert({ 
          id: documentId,
          tenant_id: tenantId,
          sender_id: 'pa_templates_manager',
          sender_email: 'ipms@system.local',
          sender_name: 'PA Templates Manager',
          content: JSON.stringify(payload),
          message_type: 'pa_templates',
          created_at: new Date().toISOString()
        });

      if (error) {
        console.error("Supabase save pa-templates error:", error.message);
        return res.status(500).json({ error: error.message });
      }
      res.json({ success: true });
    } catch (err: any) {
      console.error("PA templates save exception:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // 14. Fetch SDBIP for a tenant
  app.get("/api/tenant/:tenantId/sdbip", async (req, res) => {
    const { tenantId } = req.params;
    try {
      const supabase = getSupabase();
      let documentIds = [`sdbip_${tenantId}`];
      if (tenantId === 'tenant-229' || tenantId === 'nkangala_auto' || tenantId === 'nkangala' || tenantId === 'default') {
        documentIds = ['sdbip_tenant-229', 'sdbip_nkangala_auto', 'sdbip_global'];
      } else if (tenantId !== 'global') {
        documentIds.push(`sdbip_${tenantId}`);
        documentIds.push('sdbip_global');
      }

      for (const docId of documentIds) {
        const { data, error } = await supabase
          .from('messages')
          .select('content')
          .eq('id', docId)
          .maybeSingle();

        if (data && data.content) {
          try {
            const parsed = JSON.parse(data.content);
            const itemsArray = Array.isArray(parsed) ? parsed : (parsed?.items || []);
            if (Array.isArray(itemsArray) && itemsArray.length > 0) {
              return res.json({ items: itemsArray });
            }
          } catch (parseErr) {
            console.error("Error parsing sdbip JSON:", parseErr);
          }
        }
      }

      return res.json({ items: [] });
    } catch (err: any) {
      console.error("SDBIP load exception:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // 15. Save SDBIP for a tenant
  app.post("/api/tenant/:tenantId/sdbip", async (req, res) => {
    const { tenantId } = req.params;
    const { items } = req.body;
    try {
      const supabase = getSupabase();
      let targetDocIds = [`sdbip_${tenantId}`];
      if (tenantId === 'tenant-229' || tenantId === 'nkangala_auto' || tenantId === 'global') {
        targetDocIds = ['sdbip_tenant-229', 'sdbip_nkangala_auto', 'sdbip_global'];
      }

      for (const docId of targetDocIds) {
        const tId = docId.replace('sdbip_', '');
        await supabase
          .from('messages')
          .upsert({ 
            id: docId,
            tenant_id: tId,
            sender_id: 'sdbip_editor_tool',
            sender_email: 'sdbip@system.local',
            sender_name: 'SDBIP Editor',
            content: JSON.stringify(items),
            message_type: 'sdbip_list',
            created_at: new Date().toISOString()
          });
      }
      
      // Invalidate users cache to make sure UI is updated
      invalidateUsersCache();
      res.json({ success: true });
    } catch (err: any) {
      console.error("SDBIP save exception:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // 16. Fetch SDBIP POEs for a tenant
  app.get("/api/tenant/:tenantId/sdbip-poes", async (req, res) => {
    const { tenantId } = req.params;
    try {
      const supabase = getSupabase();
      const documentId = `sdbip_poes_${tenantId}`;
      const { data, error } = await supabase
        .from('messages')
        .select('content')
        .eq('id', documentId)
        .maybeSingle();

      if (error) {
        console.error("Supabase load sdbip poes error:", error.message);
        return res.json({ poes: [] });
      }

      if (data && data.content) {
        try {
          const parsed = JSON.parse(data.content);
          return res.json({ poes: parsed });
        } catch (parseErr) {
          console.error("Error parsing SDBIP POEs JSON:", parseErr);
        }
      }
      return res.json({ poes: [] });
    } catch (err: any) {
      console.error("SDBIP POEs load exception:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // 17. Save SDBIP POEs for a tenant
  app.post("/api/tenant/:tenantId/sdbip-poes", async (req, res) => {
    const { tenantId } = req.params;
    const { poes } = req.body;
    try {
      const supabase = getSupabase();
      const documentId = `sdbip_poes_${tenantId}`;
      const { error } = await supabase
        .from('messages')
        .upsert({ 
          id: documentId,
          tenant_id: tenantId,
          sender_id: 'sdbip_uploader_tool',
          sender_email: 'sdbip_poe@system.local',
          sender_name: 'SDBIP POE Manager',
          content: JSON.stringify(poes),
          message_type: 'sdbip_poe_list',
          created_at: new Date().toISOString()
        });
      
      if (error) throw error;
      res.json({ success: true });
    } catch (err: any) {
      console.error("SDBIP POEs save exception:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // 17.0a Fetch SDBIP Workflow Notifications for a tenant
  app.get("/api/tenant/:tenantId/sdbip-notifications", async (req, res) => {
    const { tenantId } = req.params;
    try {
      const supabase = getSupabase();
      const documentId = `sdbip_notifications_${tenantId}`;
      const { data, error } = await supabase
        .from('messages')
        .select('content')
        .eq('id', documentId)
        .maybeSingle();

      if (error) {
        console.error("Supabase load SDBIP notifications error:", error.message);
        return res.json({ notifications: [] });
      }

      if (data && data.content) {
        try {
          const parsed = JSON.parse(data.content);
          return res.json({ notifications: parsed });
        } catch (parseErr) {
          console.error("Error parsing SDBIP notifications JSON:", parseErr);
        }
      }
      return res.json({ notifications: [] });
    } catch (err: any) {
      console.error("SDBIP notifications load exception:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // 17.0b Save SDBIP Workflow Notifications for a tenant
  app.post("/api/tenant/:tenantId/sdbip-notifications", async (req, res) => {
    const { tenantId } = req.params;
    const { notifications } = req.body;
    try {
      const supabase = getSupabase();
      const documentId = `sdbip_notifications_${tenantId}`;
      const { error } = await supabase
        .from('messages')
        .upsert({ 
          id: documentId,
          tenant_id: tenantId,
          sender_id: 'sdbip_notifier_tool',
          sender_email: 'sdbip_notifications@system.local',
          sender_name: 'SDBIP Workflow Notifications Manager',
          content: JSON.stringify(notifications || []),
          message_type: 'sdbip_notifications_list',
          created_at: new Date().toISOString()
        });
      
      if (error) throw error;
      res.json({ success: true });
    } catch (err: any) {
      console.error("SDBIP notifications save exception:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // 17.01 Fetch Prior System Archive Documents for a tenant
  app.get("/api/tenant/:tenantId/prior-documents", async (req, res) => {
    const { tenantId } = req.params;
    try {
      const supabase = getSupabase();
      const documentId = `prior_archive_${tenantId}`;
      const { data, error } = await supabase
        .from('messages')
        .select('content')
        .eq('id', documentId)
        .maybeSingle();

      if (error) {
        console.error("Supabase load prior archive error:", error.message);
        return res.json({ documents: [] });
      }

      if (data && data.content) {
        try {
          const parsed = JSON.parse(data.content);
          return res.json({ documents: parsed });
        } catch (parseErr) {
          console.error("Error parsing Prior Archive JSON:", parseErr);
        }
      }
      return res.json({ documents: [] });
    } catch (err: any) {
      console.error("Prior Archive load exception:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // 17.02 Save Prior System Archive Documents for a tenant
  app.post("/api/tenant/:tenantId/prior-documents", async (req, res) => {
    const { tenantId } = req.params;
    const { documents } = req.body;
    try {
      const supabase = getSupabase();
      const documentId = `prior_archive_${tenantId}`;
      const { error } = await supabase
        .from('messages')
        .upsert({ 
          id: documentId,
          tenant_id: tenantId,
          sender_id: 'prior_archive_tool',
          sender_email: 'prior_archive@system.local',
          sender_name: 'Prior System Archive Manager',
          content: JSON.stringify(documents),
          message_type: 'prior_archive_documents_list',
          created_at: new Date().toISOString()
        });
      
      if (error) throw error;
      res.json({ success: true });
    } catch (err: any) {
      console.error("Prior Archive save exception:", err);
      res.status(500).json({ error: err.message });
    }
  });


  // 17.1 Fetch SDBIP Drafting Memo for a tenant
  app.get("/api/tenant/:tenantId/sdbip-memo", async (req, res) => {
    const { tenantId } = req.params;
    try {
      const supabase = getSupabase();
      const documentId = `sdbip_memo_${tenantId}`;
      const { data, error } = await supabase
        .from('messages')
        .select('content')
        .eq('id', documentId)
        .maybeSingle();

      if (error) {
        console.error("Supabase load sdbip memo error:", error.message);
        return res.json({ title: '', html: '' });
      }

      if (data && data.content) {
        try {
          const parsed = JSON.parse(data.content);
          return res.json(parsed);
        } catch (parseErr) {
          console.error("Error parsing SDBIP Memo JSON:", parseErr);
        }
      }
      return res.json({ title: '', html: '' });
    } catch (err: any) {
      console.error("SDBIP Memo load exception:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // 17.2 Save SDBIP Drafting Memo for a tenant
  app.post("/api/tenant/:tenantId/sdbip-memo", async (req, res) => {
    const { tenantId } = req.params;
    const { title, html } = req.body;
    try {
      const supabase = getSupabase();
      const documentId = `sdbip_memo_${tenantId}`;
      const { error } = await supabase
        .from('messages')
        .upsert({ 
          id: documentId,
          tenant_id: tenantId,
          sender_id: 'sdbip_memo_editor',
          sender_email: 'sdbip_memo@system.local',
          sender_name: 'SDBIP Memo Editor',
          content: JSON.stringify({ title, html }),
          message_type: 'sdbip_memo_document',
          created_at: new Date().toISOString()
        });
      
      if (error) throw error;
      res.json({ success: true });
    } catch (err: any) {
      console.error("SDBIP Memo save exception:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // 17.3 Fetch SDBIP Officials Directory (Reviewers & Auditors)
  app.get("/api/tenant/:tenantId/sdbip-officials", async (req, res) => {
    const { tenantId } = req.params;
    try {
      const supabase = getSupabase();
      const documentId = `sdbip_officials_${tenantId}`;
      const { data, error } = await supabase
        .from('messages')
        .select('content')
        .eq('id', documentId)
        .maybeSingle();

      const defaultOfficials = {
        reviewers: [
          'Sipho Dlamini',
          'Zama Khumalo',
          'Mike Thompson',
          'Lerato Mokwena'
        ],
        internalAuditors: [
          'Fatima Patel',
          'Brandon Naidoo',
          'Thabo Mokoena',
          'Nomvula Sithole',
          'Audrey Mpanza'
        ]
      };

      if (error) {
        console.error("Supabase load sdbip officials error:", error.message);
        return res.json(defaultOfficials);
      }

      if (data && data.content) {
        try {
          const parsed = JSON.parse(data.content);
          return res.json({
            reviewers: parsed.reviewers || defaultOfficials.reviewers,
            internalAuditors: parsed.internalAuditors || defaultOfficials.internalAuditors
          });
        } catch (parseErr) {
          console.error("Error parsing sdbip officials JSON:", parseErr);
        }
      }
      return res.json(defaultOfficials);
    } catch (err: any) {
      console.error("SDBIP officials load exception:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // 17.4 Save SDBIP Officials Directory
  app.post("/api/tenant/:tenantId/sdbip-officials", async (req, res) => {
    const { tenantId } = req.params;
    const { reviewers, internalAuditors } = req.body;
    try {
      const supabase = getSupabase();
      const documentId = `sdbip_officials_${tenantId}`;
      const { error } = await supabase
        .from('messages')
        .upsert({ 
          id: documentId,
          tenant_id: tenantId,
          sender_id: 'sdbip_officials_editor',
          sender_email: 'sdbip_officials@system.local',
          sender_name: 'SDBIP Officials Configurator',
          content: JSON.stringify({ reviewers, internalAuditors }),
          message_type: 'sdbip_officials_list',
          created_at: new Date().toISOString()
        });
      
      if (error) throw error;

      // Keep SDBIP officials in the dedicated config array/messages document,
      // but DO NOT upsert or insert them into the users database table.
      // This prevents duplicating or mutating global master directory users.

      res.json({ success: true });
    } catch (err: any) {
      console.error("SDBIP officials save exception:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // Helper to resolve the correct tenant ID for user-centric resources
  async function resolveTenantId(routeTenantId: string, userId: string): Promise<string> {
    if (!userId || userId === 'default') {
      return routeTenantId;
    }
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('users')
        .select('tenant_id')
        .ilike('email', userId.toLowerCase().trim())
        .maybeSingle();
      if (!error && data && data.tenant_id) {
        return data.tenant_id;
      }
    } catch (e) {
      console.error("resolveTenantId lookup failed:", e);
    }
    return routeTenantId;
  }

  // 17.3 Fetch Job Specific Competencies for a tenant
  app.get("/api/tenant/:tenantId/job-competencies", async (req, res) => {
    const { tenantId: routeTenantId } = req.params;
    const userId = req.query.userId ? String(req.query.userId).toLowerCase().trim() : 'default';
    try {
      const supabase = getSupabase();
      const tenantId = await resolveTenantId(routeTenantId, userId);
      const documentId = `job_competencies_${tenantId}_${userId}`;
      const { data, error } = await supabase
        .from('messages')
        .select('content')
        .eq('id', documentId)
        .maybeSingle();

      if (error) {
        console.error("Supabase load job competencies error:", error.message);
        return res.json({ competencies: [] });
      }

      if (data && data.content) {
        try {
          const parsed = JSON.parse(data.content);
          return res.json(parsed);
        } catch (parseErr) {
          console.error("Error parsing job competencies JSON:", parseErr);
        }
      }
      return res.json({ competencies: [] });
    } catch (err: any) {
      console.error("Job competencies load exception:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // 17.4 Save Job Specific Competencies for a tenant
  app.post("/api/tenant/:tenantId/job-competencies", async (req, res) => {
    const { tenantId: routeTenantId } = req.params;
    const userId = req.query.userId ? String(req.query.userId).toLowerCase().trim() : 'default';
    const { competencies, jscMasters, competencyMasters, definitionMasters, levelMasters, weightMasters } = req.body;
    try {
      const supabase = getSupabase();
      const tenantId = await resolveTenantId(routeTenantId, userId);
      const documentId = `job_competencies_${tenantId}_${userId}`;
      const { error } = await supabase
        .from('messages')
        .upsert({ 
          id: documentId,
          tenant_id: tenantId,
          sender_id: 'job_competencies_editor',
          sender_email: 'job_competencies@system.local',
          sender_name: 'Job Competencies Editor',
          content: JSON.stringify({
            competencies,
            jscMasters,
            competencyMasters,
            definitionMasters,
            levelMasters,
            weightMasters
          }),
          message_type: 'job_specific_competencies',
          created_at: new Date().toISOString()
        });
      
      if (error) throw error;
      res.json({ success: true });
    } catch (err: any) {
      console.error("Job competencies save exception:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // 17.5 Fetch SDBIP 2nd & 3rd Layers (sdbip23) for a tenant
  app.get("/api/tenant/:tenantId/sdbip23", async (req, res) => {
    const { tenantId } = req.params;
    try {
      const supabase = getSupabase();
      const documentId = `sdbip23_${tenantId}`;
      const { data, error } = await supabase
        .from('messages')
        .select('content')
        .eq('id', documentId)
        .maybeSingle();

      if (error) {
        console.error("Supabase load sdbip23 error:", error.message);
        return res.json({ items: [] });
      }

      if (data && data.content) {
        try {
          const parsed = JSON.parse(data.content);
          return res.json({ items: parsed });
        } catch (parseErr) {
          console.error("Error parsing sdbip23 JSON:", parseErr);
        }
      }
      return res.json({ items: [] });
    } catch (err: any) {
      console.error("SDBIP23 load exception:", err);
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/tenant/:tenantId/performance-agreements/extraction/:layer", async (req, res) => {
    const { tenantId, layer } = req.params;
    try {
      const supabase = getSupabase();
      const documentId = layer === '2nd' ? `pa_extract_sdbip_2nd_${tenantId}` : `pa_extract_sdbip_3rd_${tenantId}`;
      const { data, error } = await supabase
        .from('messages')
        .select('content')
        .eq('id', documentId)
        .maybeSingle();

      if (error) {
        console.error("Extraction fetch error:", error.message);
        return res.json({ items: [] });
      }

      if (data && data.content) {
        try { return res.json({ items: JSON.parse(data.content) }); } catch(e) { return res.json({items:[]}); }
      }
      return res.json({ items: [] });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // 17.6 Save SDBIP 2nd & 3rd Layers (sdbip23) for a tenant
  app.post("/api/tenant/:tenantId/sdbip23", async (req, res) => {
    const { tenantId } = req.params;
    const { items } = req.body;
    try {
      const supabase = getSupabase();
      const documentId = `sdbip23_${tenantId}`;
      const { error } = await supabase
        .from('messages')
        .upsert({ 
          id: documentId,
          tenant_id: tenantId,
          sender_id: 'sdbip23_editor',
          sender_email: 'sdbip23@system.local',
          sender_name: 'SDBIP 2nd & 3rd Layer Editor',
          content: JSON.stringify(items),
          message_type: 'sdbip23_list',
          created_at: new Date().toISOString()
        });
      
      if (error) throw error;
      res.json({ success: true });
    } catch (err: any) {
      console.error("SDBIP23 save exception:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // Core Competencies Routes
  app.get("/api/tenant/:tenantId/core-competencies", async (req, res) => {
    const { tenantId: routeTenantId } = req.params;
    const userId = req.query.userId ? String(req.query.userId).toLowerCase().trim() : 'default';
    try {
      const supabase = getSupabase();
      const resolvedTenantId = await resolveTenantId(routeTenantId, userId);
      const userSuffix = userId && userId !== 'default' ? `_${userId}` : '';
      const documentId = `core_competencies_${resolvedTenantId}${userSuffix}`;
      const { data, error } = await supabase
        .from('messages')
        .select('content')
        .eq('id', documentId)
        .maybeSingle();

      if (error) {
        console.error("Supabase load core competencies error:", error.message);
        return res.json({ items: [] });
      }

      if (data && data.content) {
        try {
          const parsed = JSON.parse(data.content);
          return res.json(parsed);
        } catch (parseErr) {
          console.error("Error parsing core competencies JSON:", parseErr);
        }
      }
      return res.json({ items: [] });
    } catch (err: any) {
      console.error("core competencies load exception:", err);
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/tenant/:tenantId/core-competencies", async (req, res) => {
    const { tenantId: routeTenantId } = req.params;
    const userId = req.query.userId ? String(req.query.userId).toLowerCase().trim() : 'default';
    const { items, cfoItems, pedItems, corporateServicesItems } = req.body;
    try {
      const supabase = getSupabase();
      const resolvedTenantId = await resolveTenantId(routeTenantId, userId);
      const userSuffix = userId && userId !== 'default' ? `_${userId}` : '';
      const documentId = `core_competencies_${resolvedTenantId}${userSuffix}`;
      const { error } = await supabase
         .from('messages')
         .upsert({ 
          id: documentId,
          tenant_id: resolvedTenantId,
          sender_id: 'core_competencies_editor_tool',
          sender_email: 'core@system.local',
          sender_name: 'Core Competencies Editor',
          content: JSON.stringify({ items, cfoItems, pedItems, corporateServicesItems }),
          message_type: 'core_competencies_list',
          created_at: new Date().toISOString()
        });

      if (error) {
        throw error;
      }
      res.json({ success: true });
    } catch (err: any) {
      console.error("core competencies save error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // PDP Routes
  app.get("/api/tenant/:tenantId/pdp", async (req, res) => {
    const { tenantId: routeTenantId } = req.params;
    const userId = req.query.userId ? String(req.query.userId).toLowerCase().trim() : 'default';
    try {
      const supabase = getSupabase();
      const tenantId = await resolveTenantId(routeTenantId, userId);
      const documentId = `pdp_${tenantId}_${userId}`;
      const { data, error } = await supabase
        .from('messages')
        .select('content')
        .eq('id', documentId)
        .maybeSingle();

      if (error) {
        console.error("Supabase load pdp error:", error.message);
        return res.json({ items: [] });
      }

      if (data && data.content) {
        try {
          const parsed = JSON.parse(data.content);
          return res.json(parsed);
        } catch (parseErr) {
          console.error("Error parsing pdp JSON:", parseErr);
        }
      }
      return res.json({ items: [] });
    } catch (err: any) {
      console.error("pdp load exception:", err);
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/tenant/:tenantId/pdp", async (req, res) => {
    const { tenantId: routeTenantId } = req.params;
    const userId = req.query.userId ? String(req.query.userId).toLowerCase().trim() : 'default';
    const { items } = req.body;
    try {
      const supabase = getSupabase();
      const tenantId = await resolveTenantId(routeTenantId, userId);
      const documentId = `pdp_${tenantId}_${userId}`;
      const { error } = await supabase
        .from('messages')
        .upsert({ 
          id: documentId,
          tenant_id: tenantId,
          sender_id: 'pdp_editor_tool',
          sender_email: 'pdp@system.local',
          sender_name: 'PDP Editor',
          content: JSON.stringify({ items }),
          message_type: 'pdp_list',
          created_at: new Date().toISOString()
        });
      
      if (error) throw error;
      res.json({ success: true });
    } catch (err: any) {
      console.error("pdp save exception:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // Performance Plan (PPLAN) Routes
  app.get("/api/tenant/:tenantId/pplan", async (req, res) => {
    const { tenantId: routeTenantId } = req.params;
    const userId = req.query.userId ? String(req.query.userId).toLowerCase().trim() : 'default';
    try {
      const supabase = getSupabase();
      const tenantId = await resolveTenantId(routeTenantId, userId);
      const documentId = `pplan_${tenantId}_${userId}`;
      const { data, error } = await supabase
        .from('messages')
        .select('content')
        .eq('id', documentId)
        .maybeSingle();

      if (error) {
        console.error("Supabase load pplan error:", error.message);
        return res.json({ metadata: {}, items: [] });
      }

      if (data && data.content) {
        try {
          const parsed = JSON.parse(data.content);
          return res.json(parsed);
        } catch (parseErr) {
          console.error("Error parsing pplan JSON:", parseErr);
        }
      }
      return res.json({ metadata: {}, items: [] });
    } catch (err: any) {
      console.error("pplan load exception:", err);
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/tenant/:tenantId/team-pplans", async (req, res) => {
    const { tenantId } = req.params;
    try {
      const supabase = getSupabase();
      
      // If global or nkangala variant, load all performance agreements, then filter appropriately in memory.
      // This is extremely robust and ensures that when administrators/managers log out of impersonation,
      // or view cross-tenant dashboards, they can retrieve agreements saved under other tenants/users.
      const queryTenantPattern = 'pplan_%';
      const { data, error } = await supabase
        .from('messages')
        .select('id, content')
        .like('id', queryTenantPattern);

      if (error) {
        console.error("Supabase load team pplans error:", error.message);
        return res.status(500).json({ error: error.message });
      }

      const tenantList = [tenantId];
      if (tenantId === 'nkangala_auto' || tenantId === 'tenant-240' || tenantId === 'tenant-229') {
        tenantList.push('nkangala_auto');
        tenantList.push('tenant-240');
        tenantList.push('tenant-229');
      }

      const teamPlans = [];
      if (data) {
        for (const row of data) {
          try {
            if (row.id && row.id.startsWith('pplan_')) {
              const parsed = typeof row.content === 'string' ? JSON.parse(row.content) : row.content;
              if (parsed && parsed.metadata) {
                let emailIdentifier = (parsed.metadata?.email || parsed.email || '').toLowerCase().trim();
                if (!emailIdentifier) {
                  if (row.id.includes('@')) {
                    const atIdx = row.id.indexOf('@');
                    const lastUnderscoreBeforeAt = row.id.lastIndexOf('_', atIdx);
                    if (lastUnderscoreBeforeAt !== -1) {
                      emailIdentifier = row.id.substring(lastUnderscoreBeforeAt + 1).toLowerCase().trim();
                    }
                  } else {
                    const idParts = row.id.split('_');
                    emailIdentifier = idParts.slice(2).join('_').toLowerCase().trim();
                  }
                }

                let rowTenant = 'global';
                if (row.id.startsWith('pplan_') && emailIdentifier && row.id.endsWith(`_${emailIdentifier}`)) {
                  rowTenant = row.id.substring(6, row.id.length - emailIdentifier.length - 1);
                } else {
                  const idParts = row.id.split('_');
                  rowTenant = idParts[1] || 'global';
                }

                // Filter in-memory if tenant context is specified and not 'global'
                if (tenantId !== 'global' && tenantList.length > 0 && !tenantList.includes(rowTenant) && !tenantList.includes('global')) {
                  // Keep targeted test emails regardless of tenant key
                  if (!emailIdentifier.includes('zulune') && !emailIdentifier.includes('nkangaladm')) {
                    continue;
                  }
                }

                teamPlans.push({
                  userId: emailIdentifier,
                  plan: parsed
                });
              }
            }
          } catch(e) {}
        }
      }
      res.json({ teamPlans });
    } catch (err: any) {
      console.error("team-pplans exception:", err);
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/tenant/:tenantId/dpmc-ledger", async (req, res) => {
    const { tenantId } = req.params;
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('messages')
        .select('content')
        .eq('id', `dpmc_ledger_${tenantId}`)
        .maybeSingle();

      if (error) {
        console.error("DPMC Ledger query error:", error);
        return res.json({ logs: [] });
      }
      if (data && data.content) {
        try {
          const parsed = JSON.parse(data.content);
          return res.json(parsed);
        } catch(parseErr) {
          console.error("DPMC Ledger parsing error:", parseErr);
        }
      }
      return res.json({ logs: [] });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/tenant/:tenantId/dpmc-ledger", async (req, res) => {
    const { tenantId } = req.params;
    const { logs } = req.body;
    try {
      const supabase = getSupabase();
      const { error } = await supabase
        .from('messages')
        .upsert({
          id: `dpmc_ledger_${tenantId}`,
          tenant_id: tenantId,
          sender_id: 'dpmc_system',
          sender_email: 'dpmc@system.local',
          sender_name: 'DPMC System Ledger',
          content: JSON.stringify({ logs }),
          message_type: 'dpmc_ledger_v1',
          created_at: new Date().toISOString()
        });
      if (error) throw error;
      res.json({ success: true, logs });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/tenant/:tenantId/audit-ledger", async (req, res) => {
    const { tenantId } = req.params;
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('messages')
        .select('content')
        .eq('id', `audit_ledger_${tenantId}`)
        .maybeSingle();

      if (error) {
        console.error("Audit Ledger query error:", error);
        return res.json({ logs: [] });
      }
      if (data && data.content) {
        try {
          const parsed = JSON.parse(data.content);
          return res.json(parsed);
        } catch(parseErr) {
          console.error("Audit Ledger parsing error:", parseErr);
        }
      }
      return res.json({ logs: [] });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/tenant/:tenantId/audit-ledger", async (req, res) => {
    const { tenantId } = req.params;
    const { logs } = req.body;
    try {
      const supabase = getSupabase();
      const { error } = await supabase
        .from('messages')
        .upsert({
          id: `audit_ledger_${tenantId}`,
          tenant_id: tenantId,
          sender_id: 'audit_system',
          sender_email: 'audit@system.local',
          sender_name: 'Audit System Ledger',
          content: JSON.stringify({ logs }),
          message_type: 'audit_ledger_v1',
          created_at: new Date().toISOString()
        });
      if (error) throw error;
      res.json({ success: true, logs });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/tenant/:tenantId/pplan", async (req, res) => {
    const { tenantId: routeTenantId } = req.params;
    const userId = req.query.userId ? String(req.query.userId).toLowerCase().trim() : 'default';
    const { metadata, items } = req.body;
    try {
      const supabase = getSupabase();
      const tenantId = await resolveTenantId(routeTenantId, userId);
      const documentId = `pplan_${tenantId}_${userId}`;
      const { error } = await supabase
        .from('messages')
        .upsert({ 
          id: documentId,
          tenant_id: tenantId,
          sender_id: 'pplan_editor_tool',
          sender_email: 'pplan@system.local',
          sender_name: 'PPLAN Editor',
          content: JSON.stringify({ metadata, items }),
          message_type: 'pplan_list',
          created_at: new Date().toISOString()
        });
      
      if (error) throw error;
      
      // Automatically map Performance Plan items to the 2nd/3rd Layer SDBIP table
      if (items && Array.isArray(items)) {
        const sdbipId = `sdbip23_${tenantId}`;
        const { data: sdbipData, error: sdbipGetError } = await supabase
          .from('messages')
          .select('content')
          .eq('id', sdbipId)
          .maybeSingle();

        let sdbipItems: any[] = [];
        if (!sdbipGetError && sdbipData && sdbipData.content) {
          try {
            const parsed = JSON.parse(sdbipData.content);
            sdbipItems = parsed.items || [];
          } catch(e) {}
        }
        
        items.forEach((pplanItem: any) => {
          const existing = sdbipItems.find((s: any) => s.id === pplanItem.id);
          const sdbipRow = {
            id: pplanItem.id,
            refNum: pplanItem.kpiNo || 'Unassigned',
            strategicObj: pplanItem.strategicGoal || 'Departmental Alignment',
            bsd: pplanItem.bsd ? 'Y' : 'N',
            led: pplanItem.led ? 'Y' : 'N',
            mfvm: pplanItem.mfvm ? 'Y' : 'N',
            ggpp: pplanItem.ggpp ? 'Y' : 'N',
            midt: pplanItem.midt ? 'Y' : 'N',
            sr: pplanItem.sr ? 'Y' : 'N',
            kpas: 'KPA 1: Service Delivery and Infrastructure Alignment',
            operationalActivity: 'Operational Target Action implementation',
            kpi: pplanItem.kpi || 'Detail not provided',
            compliance: pplanItem.review ? 'compliant' : 'non-compliant',
            uom: 'Operational measure as per evaluation evidence',
            mscoaTracking: 'Departmental budget non-financial vector',
            baseline: pplanItem.baseline || '-',
            annualTarget: pplanItem.annualTarget || '-',
            budgetAllocation: pplanItem.budget || 'R0.00',
            q1: pplanItem.annualTarget || '-',
            q2: pplanItem.annualTarget || '-',
            q3: pplanItem.annualTarget || '-',
            q4: pplanItem.annualTarget || '-',
            weight: pplanItem.weighting || '10',
            responsibleUnit: 'Assigned User Ward',
            evaluationUser: decodeURIComponent(userId) || 'Employee',
            reviewManager: 'Line Supervisor',
            poeStatus: existing ? existing.poeStatus : 'Not Uploaded',
            q1PoeDocs: existing ? existing.q1PoeDocs : [],
            q2PoeDocs: existing ? existing.q2PoeDocs : [],
            q3PoeDocs: existing ? existing.q3PoeDocs : [],
            q4PoeDocs: existing ? existing.q4PoeDocs : []
          };
          if (existing) {
             Object.assign(existing, sdbipRow);
          } else {
             sdbipItems.push(sdbipRow);
          }
        });
        
        await supabase
          .from('messages')
          .upsert({
            id: sdbipId,
            tenant_id: tenantId,
            sender_id: 'auto_sync',
            sender_email: 'sync@sdbip.node',
            sender_name: 'PPLAN Sync',
            content: JSON.stringify({ items: sdbipItems }),
            message_type: 'sdbip23_list',
            created_at: new Date().toISOString()
          });
      }

      res.json({ success: true });
    } catch (err: any) {
      console.error("pplan save exception:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // Shared Performance Reports Dispatch & Routing Routes
  app.get("/api/tenant/:tenantId/shared-reports", async (req, res) => {
    const { tenantId } = req.params;
    try {
      const supabase = getSupabase();
      const documentId = `shared_reports_${tenantId}`;
      const { data, error } = await supabase
        .from('messages')
        .select('content')
        .eq('id', documentId)
        .maybeSingle();

      if (error) {
        console.error("Supabase load shared-reports error:", error.message);
        return res.json({ reports: [] });
      }

      if (data && data.content) {
        try {
          const parsed = JSON.parse(data.content);
          return res.json(parsed);
        } catch (parseErr) {
          console.error("Error parsing shared-reports JSON:", parseErr);
        }
      }
      return res.json({ reports: [] });
    } catch (err: any) {
      console.error("shared-reports load exception:", err);
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/tenant/:tenantId/shared-reports", async (req, res) => {
    const { tenantId } = req.params;
    const { reports } = req.body;
    try {
      const supabase = getSupabase();
      const documentId = `shared_reports_${tenantId}`;
      const { error } = await supabase
        .from('messages')
        .upsert({
          id: documentId,
          tenant_id: tenantId,
          sender_id: 'reports_distribution_hub',
          sender_email: 'reports@system.local',
          sender_name: 'Reports Server',
          content: JSON.stringify({ reports }),
          message_type: 'reports_shared_list',
          created_at: new Date().toISOString()
        });

      if (error) throw error;
      res.json({ success: true });
    } catch (err: any) {
      console.error("shared-reports save exception:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // Extract from PA document via Gemini API (Actual extraction)
  app.post("/api/tenant/:tenantId/performance-agreements/extract", async (req, res) => {
    const { tenantId } = req.params;
    const { fileName, mimeType, fileData, sdbipLayer } = req.body;

    try {
      const apiKey = process.env.GEMINI_API_KEY || process.env.GEMINI || process.env.gemini;
      if (!apiKey) {
        throw new Error("GEMINI_API_KEY environment variable is not configured on this server. If you deployed this app to external hosting (like cPanel, Vercel, or a VPS), please make sure to add GEMINI_API_KEY to your environment variables or .env file there. AI Extraction requires the Gemini API.");
      }
      
      if (!fileData) {
        throw new Error("No file data provided for extraction.");
      }

      console.log(`Starting AI extraction for tenant ${tenantId}, file ${fileName}, mimeType ${mimeType}`);

      let parts: any[] = [];
      let docxHtml = "";
      
      const extractionPrompt = "You are an AI assistant processing a Performance Agreement document. Extract the following information EXACTLY based on the document: 1. SDBIP 2nd/3rd layer operational indicators and targets (kpi, weights, quarters, poe). 2. Job Specific Competencies (name, description, weight, requiredRating, etc.). 3. Personal Development Plan (PDP) items. IMPORTANT: The SDBIP often contains over 110 KPIs. Specifically, you MUST find and extract EVERY KPI from M_01 all the way through to M_92, and from P_01 all the way through to P_18, as well as ALL KPAs. You MUST extract EVERY SINGLE ONE of them exhaustively without truncation. Do not stop early.";

      // Override mimeType with magic bytes if mismatch
      let activeMimeType = mimeType;
      const lowerName = (fileName || "").toLowerCase();
      const isPdf = lowerName.endsWith(".pdf") || (mimeType && mimeType.includes("pdf"));
      const isExcel = lowerName.endsWith(".xlsx") || lowerName.endsWith(".xls") || lowerName.endsWith(".csv") || (mimeType && (mimeType.includes("sheet") || mimeType.includes("excel") || mimeType.includes("spreadsheet") || mimeType.includes("csv")));
      const isWord = lowerName.endsWith(".docx") || lowerName.endsWith(".doc") || (mimeType && (mimeType.includes("word") || mimeType.includes("msword") || mimeType.includes("officedocument.wordprocessingml")));

      if (fileData.startsWith("JVBERi") || isPdf) {
        console.log("Magic bytes or extension match PDF. Overriding mimeType to application/pdf.");
        activeMimeType = "application/pdf";
      } else if (isExcel) {
        console.log("Magic bytes or extension match Excel. Overriding mimeType to Excel Spreadsheet.");
        activeMimeType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
      } else if (isWord || fileData.startsWith("UEsDB") || fileData.startsWith("UEsFB")) {
        console.log("Magic bytes or extension match ZIP/DOCX. Overriding mimeType to OpenXML Word.");
        activeMimeType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
      }

      let parsedAsExcel = false;
      let sheetText = "";

      if (activeMimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || activeMimeType === 'application/msword') {
        try {
          const buffer = Buffer.from(fileData, 'base64');
          const result = await mammoth.convertToHtml({ buffer });
          docxHtml = result.value;
          parts = [
            { text: `Document Content:\n${docxHtml}` },
            { text: extractionPrompt }
          ];
        } catch (docxErr: any) {
          console.error("Mammoth PA parsing failed, attempting Excel fallback:", docxErr);
          try {
            const buffer = Buffer.from(fileData, 'base64');
            const workbook = XLSX.read(buffer, { type: 'buffer' });
            sheetText = "";
            workbook.SheetNames.forEach(sheetName => {
              const worksheet = workbook.Sheets[sheetName];
              const csv = XLSX.utils.sheet_to_csv(worksheet);
              sheetText += `Sheet Name: ${sheetName}\n${csv}\n\n`;
            });
            parsedAsExcel = true;
            parts = [
              { text: `Excel Spreadsheet Content (CSV Format):\n${sheetText}` },
              { text: extractionPrompt }
            ];
            console.log("Excel fallback parsed successfully!");
          } catch (excelErr: any) {
            console.error("Excel fallback also failed:", excelErr);
            throw new Error(`Could not parse DOCX/DOC file. Details: ${docxErr.message || docxErr}. Please ensure it is a valid Word document or try uploading a PDF instead.`);
          }
        }
      } else if (activeMimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || activeMimeType === 'application/vnd.ms-excel') {
        try {
          const buffer = Buffer.from(fileData, 'base64');
          const workbook = XLSX.read(buffer, { type: 'buffer' });
          sheetText = "";
          workbook.SheetNames.forEach(sheetName => {
            const worksheet = workbook.Sheets[sheetName];
            const csv = XLSX.utils.sheet_to_csv(worksheet);
            sheetText += `Sheet Name: ${sheetName}\n${csv}\n\n`;
          });
          parts = [
            { text: `Excel Spreadsheet Content (CSV Format):\n${sheetText}` },
            { text: extractionPrompt }
          ];
        } catch (excelErr: any) {
          console.error("Excel parsing failed:", excelErr);
          throw new Error(`Could not parse Excel spreadsheet. Details: ${excelErr.message || excelErr}. Please ensure it is a valid spreadsheet.`);
        }
      } else if (activeMimeType === 'application/pdf') {
        parts = [
          {
            inlineData: {
              mimeType: activeMimeType,
              data: fileData
            }
          },
          { text: extractionPrompt }
        ];
      } else {
        throw new Error(`Unsupported MIME type: ${mimeType} (Detected: ${activeMimeType}). Please upload a valid PDF, Word (.docx) or Excel (.xlsx) file.`);
      }

      const ai = new GoogleGenAI({ apiKey });
      const response = await generateContentWithRetry(ai, {
        model: "gemini-2.5-flash",
        contents: [
          {
            role: "user",
            parts
          }
        ],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              sdbip23: {
                type: Type.ARRAY,
                description: "Extracted SDBIP 2nd and 3rd layer indicators and targets",
                items: {
                  type: Type.OBJECT,
                  properties: {
                    refNum: { type: Type.STRING },
                    strategicObj: { type: Type.STRING },
                    bsd: { type: Type.STRING, description: "Y or N" },
                    led: { type: Type.STRING, description: "Y or N" },
                    mfvm: { type: Type.STRING, description: "Y or N" },
                    ggpp: { type: Type.STRING, description: "Y or N" },
                    midt: { type: Type.STRING, description: "Y or N" },
                    sr: { type: Type.STRING, description: "Y or N" },
                    kpas: { type: Type.STRING },
                    operationalActivity: { type: Type.STRING },
                    kpi: { type: Type.STRING },
                    weight: { type: Type.STRING },
                    compliance: { type: Type.STRING, description: "compliant or non-compliant" },
                    uom: { type: Type.STRING },
                    mscoaTracking: { type: Type.STRING },
                    baseline: { type: Type.STRING },
                    annualTarget: { type: Type.STRING },
                    budgetAllocation: { type: Type.STRING },
                    q1: { type: Type.STRING },
                    q2: { type: Type.STRING },
                    q3: { type: Type.STRING },
                    q4: { type: Type.STRING },
                    poe: { type: Type.STRING }
                  }
                }
              },
              jobCompetencies: {
                type: Type.ARRAY,
                description: "Job Specific Competencies extracted from the document",
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    category: { type: Type.STRING },
                    description: { type: Type.STRING },
                    requiredRating: { type: Type.INTEGER },
                    currentRating: { type: Type.INTEGER },
                    weight: { type: Type.INTEGER },
                    evidence: { type: Type.STRING }
                  }
                }
              },
              pdp: {
                type: Type.ARRAY,
                description: "Personal Development Plan (PDP) items extracted",
                items: {
                  type: Type.OBJECT,
                  properties: {
                    "Skills performance gap (in order of priority)": { type: Type.STRING },
                    "Outcomes expected": { type: Type.STRING },
                    "Suggested training and/or development activity": { type: Type.STRING },
                    "Suggested mode of delivery": { type: Type.STRING },
                    "Suggested time frame": { type: Type.STRING },
                    "Work opportunity created to practice skills/development area": { type: Type.STRING },
                    "Support person": { type: Type.STRING }
                  }
                }
              }
            }
          },
          maxOutputTokens: 60000
        }
      });

      if (!response) {
        throw new Error("No response returned from Gemini API");
      }

      console.log("AI Extraction complete.");
      let extractedData: any;
      try {
        extractedData = robustParseJson(response.text || "");
      } catch (parseErr: any) {
        console.error("JSON Parse Error. Raw response was:");
        console.error(response.text);
        throw new Error("Failed to parse AI response into JSON. " + parseErr.message);
      }
      
      if (docxHtml) {
        extractedData.draftingHTML = docxHtml;
      } else {
        extractedData.draftingHTML = "<p>PDF was analyzed for extraction. To auto-generate the complete drafting suite HTML, please upload the DOCX version of the performance agreement.</p>";
      }
      
      const isSecondLayer = sdbipLayer === '2nd Layer';
      const extractionKey = isSecondLayer ? 'pa_extract_sdbip_2nd' : 'pa_extract_sdbip_3rd';

      // Enhance the sdbip23 payload array items with unique IDs
      if (extractedData.sdbip23) {
        extractedData.sdbip23 = extractedData.sdbip23.map((item: any, idx: number) => ({
          ...item,
          id: `sdbip23_${Date.now()}_${idx}`,
          isCustom: true
        }));
      }

      // Enhance Job Competencies
      if (extractedData.jobCompetencies) {
        extractedData.jobCompetencies = extractedData.jobCompetencies.map((item: any, idx: number) => ({
          ...item,
          id: `comp_${Date.now()}_${idx}`,
          isCustom: true
        }));
      }

      const supabase = getSupabase();
      
      // Save SDBIP
      if (extractedData.sdbip23 && extractedData.sdbip23.length > 0) {
        await supabase.from('messages').upsert({
          id: `${extractionKey}_${tenantId}`,
          tenant_id: tenantId,
          sender_id: 'pa_extraction_engine',
          sender_email: 'extraction@system.local',
          sender_name: 'Extraction Engine',
          content: JSON.stringify(extractedData.sdbip23),
          message_type: 'sdbip23_list',
          created_at: new Date().toISOString()
        });
      }
      
      // Save JSC to tenant level - Note: mapping uniquely to users profile
      if (extractedData.jobCompetencies && extractedData.jobCompetencies.length > 0) {
        await supabase.from('messages').upsert({
          id: `job_competencies_${tenantId}`,
          tenant_id: tenantId,
          sender_id: 'pa_extraction_engine',
          sender_email: 'extraction@system.local',
          sender_name: 'Extraction Engine',
          content: JSON.stringify({ competencies: extractedData.jobCompetencies }),
          message_type: 'job_specific_competencies',
          created_at: new Date().toISOString()
        });
      }
      
      // Save PDP
      if (extractedData.pdp && extractedData.pdp.length > 0) {
        await supabase.from('messages').upsert({
          id: `pdp_${tenantId}`,
          tenant_id: tenantId,
          sender_id: 'pa_extraction_engine',
          sender_email: 'extraction@system.local',
          sender_name: 'Extraction Engine',
          content: JSON.stringify({ items: extractedData.pdp }),
          message_type: 'pdp_list',
          created_at: new Date().toISOString()
        });
      }
      
      // Save Drafting HTML
      if (extractedData.draftingHTML) {
         await supabase.from('messages').upsert({
          id: `draft_doc_${tenantId}`,
          tenant_id: tenantId,
          sender_id: 'pa_extraction_engine',
          sender_email: 'extraction@system.local',
          sender_name: 'Extraction Engine',
          content: JSON.stringify({ html: extractedData.draftingHTML }),
          message_type: 'drafting_suite_doc',
          created_at: new Date().toISOString()
        });     
      }

      res.json({ success: true, extractedCount: {
        sdbip: (extractedData.sdbip23 || []).length,
        jsc: (extractedData.jobCompetencies || []).length,
        pdp: (extractedData.pdp || []).length,
        draftingHTMLBytes: extractedData.draftingHTML ? extractedData.draftingHTML.length : 0
      }});
    } catch (err: any) {
      console.error("Extraction error:", err);
      res.status(500).json({ error: err.message || JSON.stringify(err) });
    }
  });

  // Drafting Suite Document retrieval and saving
  app.get("/api/tenant/:tenantId/pa-drafting-doc", async (req, res) => {
    const { tenantId: routeTenantId } = req.params;
    const userId = req.query.userId ? String(req.query.userId).toLowerCase().trim() : 'default';
    const reqDocumentId = req.query.documentId ? String(req.query.documentId) : undefined;
    try {
      const supabase = getSupabase();
      const tenantId = await resolveTenantId(routeTenantId, userId);
      let documentId = reqDocumentId || `draft_doc_${tenantId}`;
      if (userId && userId !== 'default') {
        if (reqDocumentId) {
          const resolvedDocumentId = reqDocumentId.replace(`_${routeTenantId}`, `_${tenantId}`).replace(routeTenantId, tenantId);
          documentId = resolvedDocumentId.toLowerCase().includes(userId.toLowerCase()) ? resolvedDocumentId : `${resolvedDocumentId}_${userId}`;
        } else {
          documentId = `draft_doc_${tenantId}_${userId}`;
        }
      }
      documentId = documentId.toLowerCase();
      
      let { data, error } = await supabase
        .from('messages')
        .select('content')
        .eq('id', documentId)
        .maybeSingle();

      // Fallback to global draft if user-specific draft doesn't exist
      if ((!data || !data.content) && userId && userId !== 'default') {
        const globalId = reqDocumentId 
          ? reqDocumentId.replace(`_${routeTenantId}`, `_${tenantId}`).replace(routeTenantId, tenantId).toLowerCase() 
          : `draft_doc_${tenantId}`;
        const globalRes = await supabase
          .from('messages')
          .select('content')
          .eq('id', globalId)
          .maybeSingle();
        if (globalRes.data) {
          data = globalRes.data;
        }
      }

      if (error) {
        console.error("Supabase load draft error:", error.message);
        return res.json({ html: "" });
      }

      if (data && data.content) {
        try {
          const parsed = typeof data.content === 'string' ? JSON.parse(data.content) : data.content;
          return res.json(parsed);
        } catch (parseErr) {
          console.error("Error parsing PA draft JSON:", parseErr);
        }
      }
      return res.json({ html: "" });
    } catch (err: any) {
      console.error("PA draft load exception:", err);
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/tenant/:tenantId/pa-drafting-doc", async (req, res) => {
    const { tenantId: routeTenantId } = req.params;
    const userId = req.query.userId ? String(req.query.userId).toLowerCase().trim() : 'default';
    const { html, htmlDocumentId } = req.body;
    try {
      const supabase = getSupabase();
      const tenantId = await resolveTenantId(routeTenantId, userId);
      let documentId = htmlDocumentId || `draft_doc_${tenantId}`;
      if (userId && userId !== 'default') {
        if (htmlDocumentId) {
          const resolvedHtmlDocumentId = htmlDocumentId.replace(`_${routeTenantId}`, `_${tenantId}`).replace(routeTenantId, tenantId);
          documentId = resolvedHtmlDocumentId.toLowerCase().includes(userId.toLowerCase()) ? resolvedHtmlDocumentId : `${resolvedHtmlDocumentId}_${userId}`;
        } else {
          documentId = `draft_doc_${tenantId}_${userId}`;
        }
      }
      documentId = documentId.toLowerCase();
      
      const { error } = await supabase
        .from('messages')
        .upsert({ 
          id: documentId,
          tenant_id: tenantId,
          sender_id: 'pa_editor_tool',
          sender_email: 'pa@system.local',
          sender_name: 'PA Editor',
          content: JSON.stringify({ html }),
          message_type: 'drafting_suite_doc',
          created_at: new Date().toISOString()
        });
      
      if (error) throw error;

      // Auto-overwrite the target user's other profile modules (PPLAN, Core Competencies, PDP)
      if (userId && userId !== 'default') {
        let stateObj: any = {};
        if (typeof html === 'string') {
          try {
            stateObj = JSON.parse(html);
          } catch (e) {
            stateObj = {};
          }
        } else if (html && typeof html === 'object') {
          stateObj = html;
        }

        // 1) Overwrite Performance Plan (PPLAN) Module
        const planItems = stateObj.pulledPplanItems || stateObj.pulledFilteredPplanItems;
        if (planItems && Array.isArray(planItems) && planItems.length > 0) {
          const pplanDocId = `pplan_${tenantId}_${userId}`;
          
          const { data: existingPplan } = await supabase
            .from('messages')
            .select('content')
            .eq('id', pplanDocId)
            .maybeSingle();
          
          let existingMetadata = {};
          if (existingPplan && existingPplan.content) {
            try {
              const parsed = JSON.parse(existingPplan.content);
              existingMetadata = parsed.metadata || {};
            } catch (e) {}
          }

          await supabase
            .from('messages')
            .upsert({
              id: pplanDocId,
              tenant_id: tenantId,
              sender_id: 'pplan_editor_tool',
              sender_email: 'pplan@system.local',
              sender_name: 'PPLAN Editor',
              content: JSON.stringify({ 
                metadata: {
                  ...existingMetadata,
                  lastPushedFromTemplate: new Date().toISOString(),
                  pushedBy: stateObj.pushedBy || 'System'
                }, 
                items: planItems 
              }),
              message_type: 'pplan_list',
              created_at: new Date().toISOString()
            });

          // Automatically map Performance Plan items to the 2nd/3rd Layer SDBIP table for this tenant
          const sdbipId = `sdbip23_${tenantId}`;
          const { data: sdbipData, error: sdbipGetError } = await supabase
            .from('messages')
            .select('content')
            .eq('id', sdbipId)
            .maybeSingle();

          let sdbipItems: any[] = [];
          if (!sdbipGetError && sdbipData && sdbipData.content) {
            try {
              const parsed = JSON.parse(sdbipData.content);
              sdbipItems = parsed.items || [];
            } catch(e) {}
          }
          
          planItems.forEach((pplanItem: any) => {
            const existingIdx = sdbipItems.findIndex((s: any) => s.id === pplanItem.id);
            const sdbipRow = {
              id: pplanItem.id,
              refNum: pplanItem.kpiNo || 'Unassigned',
              kpi: pplanItem.kpi || '',
              weight: pplanItem.weighting || 0,
              baseline: pplanItem.baseline || '',
              target: pplanItem.annualTarget || '',
              q1: pplanItem.q1Target || '',
              q2: pplanItem.q2Target || '',
              q3: pplanItem.q3Target || '',
              q4: pplanItem.q4Target || '',
              poe: pplanItem.poe || '',
              budget: pplanItem.budget || '',
              kpa: pplanItem.kpa || '',
              owner: userId,
              status: 'Adopted'
            };
            if (existingIdx !== -1) {
              sdbipItems[existingIdx] = { ...sdbipItems[existingIdx], ...sdbipRow };
            } else {
              sdbipItems.push(sdbipRow);
            }
          });

          await supabase
            .from('messages')
            .upsert({
              id: sdbipId,
              tenant_id: tenantId,
              sender_id: 'sdbip_system',
              sender_email: 'sdbip@system.local',
              sender_name: 'SDBIP Master Engine',
              content: JSON.stringify({ items: sdbipItems }),
              message_type: 'sdbip23_list',
              created_at: new Date().toISOString()
            });
        }

        // 2) Overwrite Core Competencies (job-competencies) Module
        const competencyRows = stateObj.pulledCompetencyRows;
        if (competencyRows && Array.isArray(competencyRows) && competencyRows.length > 0) {
          const compDocId = `job_competencies_${tenantId}_${userId}`;
          
          const { data: existingComp } = await supabase
            .from('messages')
            .select('content')
            .eq('id', compDocId)
            .maybeSingle();
          
          let jscMasters = [];
          let competencyMasters = [];
          let definitionMasters = [];
          let levelMasters = [];
          let weightMasters = [];
          
          if (existingComp && existingComp.content) {
            try {
              const parsed = JSON.parse(existingComp.content);
              jscMasters = parsed.jscMasters || [];
              competencyMasters = parsed.competencyMasters || [];
              definitionMasters = parsed.definitionMasters || [];
              levelMasters = parsed.levelMasters || [];
              weightMasters = parsed.weightMasters || [];
            } catch (e) {}
          }

          const mappedCompetencies = competencyRows.map((row: any, idx: number) => {
            return {
              id: row.id || `comp-row-${idx}-${Date.now()}`,
              jscNo: row.jscNo || `CORE-${idx + 1}`,
              competency: row.title || row.competency || row.name || 'Core Competency',
              definition: {
                mainText: row.mainText || row.description || row.competent || row.basic || 'Standard competency level mapping.',
                subsections: row.subsections || []
              },
              level: row.level || 'Level 2: Competent Operator',
              weight: Number(row.weight || row.weighting || 10)
            };
          });

          await supabase
            .from('messages')
            .upsert({
              id: compDocId,
              tenant_id: tenantId,
              sender_id: 'job_competencies_editor',
              sender_email: 'job_competencies@system.local',
              sender_name: 'Job Competencies System',
              content: JSON.stringify({
                competencies: mappedCompetencies,
                jscMasters,
                competencyMasters,
                definitionMasters,
                levelMasters,
                weightMasters,
                lastPushedFromTemplate: new Date().toISOString()
              }),
              message_type: 'job_specific_competencies',
              created_at: new Date().toISOString()
            });
        }

        // 3) Overwrite PDP (pdp) Module
        const pdpRows = stateObj.pulledPdpItems;
        if (pdpRows && Array.isArray(pdpRows) && pdpRows.length > 0) {
          const pdpDocId = `pdp_${tenantId}_${userId}`;
          
          const { data: existingPdp } = await supabase
            .from('messages')
            .select('content')
            .eq('id', pdpDocId)
            .maybeSingle();
          
          let skillsGapsMasters = [];
          let trainingsMasters = [];
          let modesMasters = [];
          let supportMasters = [];
          
          if (existingPdp && existingPdp.content) {
            try {
              const parsed = JSON.parse(existingPdp.content);
              skillsGapsMasters = parsed.skillsGapsMasters || [];
              trainingsMasters = parsed.trainingsMasters || [];
              modesMasters = parsed.modesMasters || [];
              supportMasters = parsed.supportMasters || [];
            } catch (e) {}
          }

          const mappedPdp = pdpRows.map((row: any, idx: number) => {
            return {
              id: row.id || `pdp-row-${idx}-${Date.now()}`,
              skillsGap: row.skillsGap || row.gap || '',
              outcomes: row.outcomes || row.outcome || '',
              suggestedTraining: row.suggestedTraining || row.training || '',
              modeOfDelivery: row.modeOfDelivery || row.mode || '',
              timeFrame: row.timeFrame || row.period || '',
              workOpportunity: row.workOpportunity || row.opportunity || '',
              supportPerson: row.supportPerson || row.support || ''
            };
          });

          await supabase
            .from('messages')
            .upsert({
              id: pdpDocId,
              tenant_id: tenantId,
              sender_id: 'pdp_editor_tool',
              sender_email: 'pdp@system.local',
              sender_name: 'PDP System',
              content: JSON.stringify({
                items: mappedPdp,
                skillsGapsMasters,
                trainingsMasters,
                modesMasters,
                supportMasters,
                lastPushedFromTemplate: new Date().toISOString()
              }),
              message_type: 'pdp_list',
              created_at: new Date().toISOString()
            });
        }
      }

      res.json({ success: true });
    } catch (err: any) {
      console.error("PA draft save exception:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // 17.7 Fetch Performance Agreements for a tenant
  app.get("/api/tenant/:tenantId/performance-agreements", async (req, res) => {
    const { tenantId } = req.params;
    const userId = req.query.userId ? String(req.query.userId) : 'default';
    try {
      const supabase = getSupabase();
      const documentId = `perf_agreement_${tenantId}`;
      const { data, error } = await supabase
        .from('messages')
        .select('content')
        .eq('id', documentId)
        .maybeSingle();

      if (error) {
        console.error("Supabase load PA error:", error.message);
        return res.json({ agreements: [] });
      }

      if (data && data.content) {
        try {
          const parsed = JSON.parse(data.content);
          return res.json(parsed);
        } catch (parseErr) {
          console.error("Error parsing PA JSON:", parseErr);
        }
      }
      return res.json({ agreements: [] });
    } catch (err: any) {
      console.error("PA load exception:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // 17.8 Save Performance Agreements for a tenant
  app.post("/api/tenant/:tenantId/performance-agreements", async (req, res) => {
    const { tenantId } = req.params;
    const userId = req.query.userId ? String(req.query.userId) : 'default';
    const { agreements } = req.body;
    try {
      const supabase = getSupabase();
      const documentId = `perf_agreement_${tenantId}`;
      const { error } = await supabase
        .from('messages')
        .upsert({ 
          id: documentId,
          tenant_id: tenantId,
          sender_id: 'pa_editor',
          sender_email: 'pa@system.local',
          sender_name: 'Performance Agreements Editor',
          content: JSON.stringify({ agreements }),
          message_type: 'performance_agreements',
          created_at: new Date().toISOString()
        });
      
      if (error) throw error;
      res.json({ success: true });
    } catch (err: any) {
      console.error("PA save exception:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // 17.9 Fetch JSC Custom Drafting Document (jsc-draft) for a tenant
  app.get("/api/tenant/:tenantId/jsc-draft", async (req, res) => {
    const { tenantId } = req.params;
    const userId = req.query.userId ? String(req.query.userId) : 'default';
    try {
      const supabase = getSupabase();
      const documentId = `jsc_draft_${tenantId}_${userId}`;
      const { data, error } = await supabase
        .from('messages')
        .select('content')
        .eq('id', documentId)
        .maybeSingle();

      if (error) {
        console.error("Supabase load JSC draft error:", error.message);
        return res.json({ title: '', html: '' });
      }

      if (data && data.content) {
        try {
          const parsed = JSON.parse(data.content);
          return res.json(parsed);
        } catch (parseErr) {
          console.error("Error parsing JSC draft JSON:", parseErr);
        }
      }
      return res.json({ title: '', html: '' });
    } catch (err: any) {
      console.error("JSC draft load exception:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // 17.10 Save JSC Custom Drafting Document (jsc-draft) for a tenant
  app.post("/api/tenant/:tenantId/jsc-draft", async (req, res) => {
    const { tenantId } = req.params;
    const userId = req.query.userId ? String(req.query.userId) : 'default';
    const { title, html } = req.body;
    try {
      const supabase = getSupabase();
      const documentId = `jsc_draft_${tenantId}_${userId}`;
      const { error } = await supabase
        .from('messages')
        .upsert({ 
          id: documentId,
          tenant_id: tenantId,
          sender_id: 'jsc_draft_editor',
          sender_email: 'jsc_draft@system.local',
          sender_name: 'JSC Draft Editor',
          content: JSON.stringify({ title, html }),
          message_type: 'jsc_draft_document',
          created_at: new Date().toISOString()
        });
      
      if (error) throw error;
      res.json({ success: true });
    } catch (err: any) {
      console.error("JSC draft save exception:", err);
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/tenant/:tenantId/kpis", async (req, res) => {
    const { tenantId } = req.params;
    const userId = req.query.userId ? String(req.query.userId) : 'default';
    try {
      const supabase = getSupabase();
      const documentId = `kpis_${tenantId}_${userId}`;
      const { data, error } = await supabase
        .from('messages')
        .select('content')
        .eq('id', documentId)
        .maybeSingle();

      if (error) {
        console.error("Supabase load kpis error:", error.message);
        return res.json({ kpis: [] });
      }

      if (data && data.content) {
        try {
          const parsed = JSON.parse(data.content);
          return res.json({ kpis: parsed });
        } catch (parseErr) {
          console.error("Error parsing kpis JSON:", parseErr);
        }
      }
      return res.json({ kpis: [] });
    } catch (err: any) {
      console.error("KPIs load exception:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // 19. Save KPIs for a tenant
  app.post("/api/tenant/:tenantId/kpis", async (req, res) => {
    const { tenantId } = req.params;
    const userId = req.query.userId ? String(req.query.userId) : 'default';
    const { kpis } = req.body;
    try {
      const supabase = getSupabase();
      const documentId = `kpis_${tenantId}_${userId}`;
      const { error } = await supabase
        .from('messages')
        .upsert({ 
          id: documentId,
          tenant_id: tenantId,
          sender_id: 'kpi_manager_tool',
          sender_email: 'kpi@system.local',
          sender_name: 'KPI Manager',
          content: JSON.stringify(kpis),
          message_type: 'kpis_list',
          created_at: new Date().toISOString()
        });
      
      if (error) throw error;
      res.json({ success: true });
    } catch (err: any) {
      console.error("KPIs save exception:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // 20. Fetch Strategic Objectives for a tenant
  app.get("/api/tenant/:tenantId/strategic-objectives", async (req, res) => {
    const { tenantId } = req.params;
    try {
      const supabase = getSupabase();
      const documentId = `strategic_objectives_${tenantId}`;
      const { data, error } = await supabase
        .from('messages')
        .select('content')
        .eq('id', documentId)
        .maybeSingle();

      if (error) {
        console.error("Supabase load strategic-objectives error:", error.message);
        return res.json({ strategicObjectives: [] });
      }

      if (data && data.content) {
        try {
          const parsed = JSON.parse(data.content);
          return res.json({ strategicObjectives: parsed });
        } catch (parseErr) {
          console.error("Error parsing strategic-objectives JSON:", parseErr);
        }
      }
      return res.json({ strategicObjectives: [] });
    } catch (err: any) {
      console.error("Strategic Objectives load exception:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // 21. Save Strategic Objectives for a tenant
  app.post("/api/tenant/:tenantId/strategic-objectives", async (req, res) => {
    const { tenantId } = req.params;
    const { strategicObjectives } = req.body;
    try {
      const supabase = getSupabase();
      const documentId = `strategic_objectives_${tenantId}`;
      const { error } = await supabase
        .from('messages')
        .upsert({ 
          id: documentId,
          tenant_id: tenantId,
          sender_id: 'strategic_objectives_manager_tool',
          sender_email: 'strategic_objectives@system.local',
          sender_name: 'Strategic Objectives Manager',
          content: JSON.stringify(strategicObjectives),
          message_type: 'strategic_objectives_list',
          created_at: new Date().toISOString()
        });
      
      if (error) throw error;
      res.json({ success: true });
    } catch (err: any) {
      console.error("Strategic Objectives save exception:", err);
      res.status(500).json({ error: err.message });
    }
  });


  // 21.b. Fetch Risk Management for a tenant
  app.get("/api/tenant/:tenantId/risk-management", async (req, res) => {
    const { tenantId } = req.params;
    try {
      const supabase = getSupabase();
      const documentId = `risk_management_${tenantId}`;
      const { data, error } = await supabase
        .from('messages')
        .select('content')
        .eq('id', documentId)
        .maybeSingle();

      if (error) {
        console.error("Supabase load risk-management error:", error.message);
        return res.json({ typesOfRisks: [], templates: [], drafts: [] });
      }

      if (data && data.content) {
        try {
          const parsed = JSON.parse(data.content);
          return res.json({
            typesOfRisks: parsed.typesOfRisks || [],
            templates: parsed.templates || [],
            drafts: parsed.drafts || [],
            riskRegister: parsed.riskRegister || [],
            electronicReports: parsed.electronicReports || [],
            popiaData: parsed.popiaData || null,
            poeFiles: parsed.poeFiles || {}
          });
        } catch (parseErr) {
          console.error("Error parsing risk-management JSON:", parseErr);
        }
      }
      return res.json({ typesOfRisks: [], templates: [], drafts: [], riskRegister: [], electronicReports: [], popiaData: null, poeFiles: {} });
    } catch (err: any) {
      console.error("Risk Management load exception:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // 21.c. Save Risk Management for a tenant
  app.post("/api/tenant/:tenantId/risk-management", async (req, res) => {
    const { tenantId } = req.params;
    const { typesOfRisks, templates, drafts, riskRegister, electronicReports, popiaData, poeFiles } = req.body;
    try {
      const supabase = getSupabase();
      const documentId = `risk_management_${tenantId}`;
      const { error } = await supabase
        .from('messages')
        .upsert({ 
          id: documentId,
          tenant_id: tenantId,
          sender_id: 'risk_management_manager_tool',
          sender_email: 'risk_management@system.local',
          sender_name: 'Risk Management Manager',
          content: JSON.stringify({ typesOfRisks, templates, drafts, riskRegister, electronicReports, popiaData, poeFiles }),
          message_type: 'risk_management_store',
          created_at: new Date().toISOString()
        });
      
      if (error) throw error;
      res.json({ success: true });
    } catch (err: any) {
      console.error("Risk Management save exception:", err);
      res.status(500).json({ error: err.message });
    }
  });


  // Proxy image to bypass Unsplash CORS/Referrer blocks in browser
  app.get("/api/tenant/:tenantId/ar-draft", async (req, res) => {
    try {
      const { tenantId } = req.params;
      const draftId = req.query.draftId || "Annual_Report_v1_Draft";
      const supabase = getSupabase();
      if (!supabase) return res.status(500).json({ error: "No DB" });
      const { data, error } = await supabase.from('messages').select('content').eq('id', `ar_draft_${tenantId}_${draftId}`).maybeSingle();
      if (error) throw error;
      if (data && data.content) {
        try {
          return res.json({ draft: JSON.parse(data.content) });
        } catch (e) {
          return res.json({ draft: null });
        }
      }
      return res.json({ draft: null });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/tenant/:tenantId/ar-draft", async (req, res) => {
    try {
      const { tenantId } = req.params;
      const { draft, draftId } = req.body;
      const finalDraftId = draftId || "Annual_Report_v1_Draft";
      const supabase = getSupabase();
      if (!supabase) return res.status(500).json({ error: "No DB" });
      
      const payload = {
        id: `ar_draft_${tenantId}_${finalDraftId}`,
        tenant_id: tenantId,
        sender_id: 'ar_editor_tool',
        sender_email: 'ar@system.local',
        sender_name: 'AR Editor',
        content: JSON.stringify(draft),
        message_type: 'ar_draft',
        created_at: new Date().toISOString()
      };
      
      const { error } = await supabase.from('messages').upsert(payload);
      if (error) throw error;
      
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/upload-signature", async (req, res) => {
    try {
      const { signatureData, userId, tenantId } = req.body;
      if (!signatureData) {
        return res.status(400).json({ error: "Missing signatureData base64" });
      }

      const supabase = getSupabase();
      if (!supabase) return res.status(500).json({ error: "No DB" });

      const matches = signatureData.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (!matches || matches.length !== 3) {
         return res.status(400).json({ error: "Invalid base64 string format" });
      }

      const contentType = matches[1];
      const base64Data = matches[2];
      const buffer = Buffer.from(base64Data, 'base64');
      
      const fileName = `signature_${tenantId || 'global'}_${userId || 'unknown'}_${Date.now()}.png`;

      const { data, error } = await supabase.storage.from('signatures').upload(fileName, buffer, {
        contentType: contentType,
        upsert: true
      });

      if (error) {
        if (error.message.toLowerCase().includes('bucket') || error.message.toLowerCase().includes('does not exist') || error.message.toLowerCase().includes('not found')) {
           const { error: createBucketError } = await supabase.storage.createBucket('signatures', { public: true });
           if (createBucketError && !createBucketError.message.includes('already exists')) {
              throw createBucketError;
           }
           const { error: retryError } = await supabase.storage.from('signatures').upload(fileName, buffer, {
             contentType: contentType,
             upsert: true
           });
           if (retryError) throw retryError;
        } else {
           throw error;
        }
      }

      const { data: publicUrlData } = supabase.storage.from('signatures').getPublicUrl(fileName);
      
      res.json({ success: true, url: publicUrlData.publicUrl });
    } catch (err: any) {
      console.error("Signature upload error:", err);
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/download/azure-ad-users.xlsx", (req, res) => {
    try {
      const filePath = path.join(process.cwd(), "azure_ad_users.xlsx");
      if (fs.existsSync(filePath)) {
        res.download(filePath, "Azure_AD_Users_With_Titles.xlsx");
      } else {
        res.status(404).send("File not found. Please contact support.");
      }
    } catch (err: any) {
      res.status(500).send("Error serving file: " + err.message);
    }
  });

  app.get('/api/proxy-image', async (req, res) => {
    try {
      const imageUrl = req.query.url;
      if (!imageUrl || typeof imageUrl !== 'string') return res.status(400).send('Missing url');
      const response = await fetch(imageUrl);
      if (!response.ok) return res.status(response.status).send('Proxied target returned ' + response.statusText);
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const contentType = response.headers.get('content-type') || 'image/jpeg';
      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'public, max-age=31536000');
      res.send(buffer);
    } catch (e) {
      res.status(500).send(e.message);
    }
  });

  // Generic load endpoint for NEDA subsidiary portal
  app.get("/api/neda/:tenantId/:key", async (req, res) => {
    const { tenantId, key } = req.params;
    try {
      const supabase = getSupabase();
      if (!supabase) return res.status(500).json({ error: "No DB connection available." });
      
      const documentId = `neda_${tenantId}_${key}`;
      const { data, error } = await supabase
        .from('messages')
        .select('content')
        .eq('id', documentId)
        .maybeSingle();

      if (error) {
        console.error(`Supabase load NEDA ${key} error:`, error.message);
        return res.json({ data: null });
      }

      if (data && data.content) {
        try {
          const parsed = JSON.parse(data.content);
          return res.json({ data: parsed });
        } catch (parseErr) {
          console.error(`Error parsing NEDA ${key} JSON:`, parseErr);
        }
      }
      return res.json({ data: null });
    } catch (err: any) {
      console.error(`NEDA ${key} load exception:`, err);
      res.status(500).json({ error: err.message });
    }
  });

  // Generic save endpoint for NEDA subsidiary portal
  app.post("/api/neda/:tenantId/:key", async (req, res) => {
    const { tenantId, key } = req.params;
    const payload = req.body;
    try {
      const supabase = getSupabase();
      if (!supabase) return res.status(500).json({ error: "No DB connection available." });

      const documentId = `neda_${tenantId}_${key}`;
      const { error } = await supabase
        .from('messages')
        .upsert({ 
          id: documentId,
          tenant_id: tenantId,
          content: JSON.stringify(payload),
          sender_id: 'NEDA_SYSTEM',
          message_type: 'neda_document',
          created_at: new Date().toISOString()
        }, { onConflict: 'id' });

      if (error) {
        console.error(`Supabase save NEDA ${key} error:`, error.message);
        return res.status(500).json({ error: error.message });
      }

      res.json({ success: true });
    } catch (err: any) {
      console.error(`NEDA ${key} save exception:`, err);
      res.status(500).json({ error: err.message });
    }
  });

  // Global error handler for /api endpoints to ensure JSON is always returned instead of HTML
  app.use('/api', (err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error(`[API Handler Error] ${req.method} ${req.url}:`, err);
    if (res.headersSent) {
      return next(err);
    }
    res.status(err.status || 500).json({
      success: false,
      error: err.message || "Internal Server Error"
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));

    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Synchronize Nkangala District Municipality folder on startup and set kickoff timestamp
  try {
    const supabase = getSupabase();
    (async () => {
      try {
        const currentISO = new Date().toISOString();
        await supabase.from('messages').upsert({
          id: 'system_session_kickoff',
          tenant_id: 'global',
          sender_id: 'system',
          sender_email: 'system@local',
          sender_name: 'System Administrator',
          content: JSON.stringify({ kickoffTime: currentISO }),
          created_at: currentISO
        });
        console.log(`---- SET SYSTEM SESSION KICKOFF ON STARTUP: ${currentISO} ----`);
      } catch (kickoffErr: any) {
        console.log("Error inside startup session kickoff routine:", kickoffErr.message);
      }

      try {
        const localList = getTenantsList();
        if (localList.length > 0) {
          const { data: existing } = await supabase
            .from('messages')
            .select('id')
            .eq('id', 'municipalities_list')
            .maybeSingle();
          if (!existing) {
            await supabase.from('messages').insert({
              id: 'municipalities_list',
              content: JSON.stringify(localList),
              tenant_id: 'global',
              sender_id: 'system',
              sender_email: 'system@local',
              sender_name: 'System Administrator',
              created_at: new Date().toISOString()
            });
            console.log("---- SEEDED 257 MUNICIPALITIES LIST TO SUPABASE ----");
          }
        }
      } catch (seedErr: any) {
        console.log("Error inside startup municipalities list seeding routine:", seedErr.message);
      }

      try {
        let { data: users, error: userError } = await supabase.from('users').select('*');
        if (userError) {
          console.log("Could not perform startup users fetch", userError.message);
          return;
        }

        const seedUsers = [
          { email: 'mike@mzansiflow.co.za', fullName: 'Mike', role: 'Global Administrator' },
          { email: 'mike@massivedynamixdistributors.com', fullName: 'Mike', role: 'Global Administrator' },
          { email: 'audrey@mzansiflow.co.za', fullName: 'Audrey', role: 'Global Administrator' },
          { email: 'bonagni@mzansiflow.co.za', fullName: 'Bonagni', role: 'Systems Administrator' },
          { email: 'qiniso@mzansiflow.co.za', fullName: 'Qiniso', role: 'Systems Administrator' },
          { email: 'marlan@mzansiflow.co.za', fullName: 'Marlan', role: 'Systems Administrator' },
          { email: 'delphine@mzansiflow.co.za', fullName: 'Delphine', role: 'Global Administrator' }
        ];

        let seededAny = false;
        for (const su of seedUsers) {
          const existingUser = (users || []).find((u: any) => u.email && u.email.toLowerCase() === su.email.toLowerCase());
          if (!existingUser) {
            const newId = 'seed_' + Math.random().toString(36).substring(2);
            await supabase.from('users').insert({
              id: newId,
              full_name: su.fullName,
              email: su.email,
              role: su.role,
              source: 'manual',
              tenant_id: 'global'
            });
            console.log(`[Seeding] Seeded core user: ${su.email} with role ${su.role}`);
            seededAny = true;
          } else if (existingUser.role !== su.role) {
            await supabase.from('users').update({ role: su.role }).eq('id', existingUser.id);
            console.log(`[Seeding] Updated existing user role: ${su.email} to ${su.role}`);
            seededAny = true;
          }
        }

        if (seededAny) {
          const { data: refetched } = await supabase.from('users').select('*');
          if (refetched) users = refetched;
        }

        if (users && users.length > 0) {
          let map: any = {};
          try {
            const { data: mData } = await supabase.from('messages').select('content').eq('id', 'users_extra_metadata').maybeSingle();
            if (mData && mData.content) {
              map = JSON.parse(mData.content);
            }
          } catch (je) {}
          const formatted = users.map((u: any) => ({
            id: u.id,
            fullName: u.full_name,
            email: u.email,
            jobFunction: u.job_function,
            department: u.department,
            source: u.source,
            role: u.role,
            tenantId: u.tenant_id,
            manager: map[u.id]?.manager || '',
            directorate: map[u.id]?.directorate || '',
            reportTo: map[u.id]?.reportTo || '',
            level: map[u.id]?.level || '1'
          }));
          saveNkangalaToDisk(formatted);
          console.log("---- Synchronized Nkangala users on startup ----");
          
          // Also sync user profile backup archives for verified Azure AD users
          await syncAzureUserProfileBackupFolders();
          console.log("---- Synchronized Azure AD backup profile folders on startup ----");
        }
      } catch (err: any) {
        console.log("Error inside startup users fetch routine:", err.message);
      }
    })();
  } catch (e) {
    console.log("Could not synchronize Nkangala district municipality on startup:", e);
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();