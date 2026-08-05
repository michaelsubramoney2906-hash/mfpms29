const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const postPplanSyncRegex = /const targetUsers = SYNCED_EMAILS\.includes\(userId\) \? SYNCED_EMAILS : \[userId\];[\s\S]*?for \(const u of targetUsers\) \{[\s\S]*?const uDocId = `pplan_\$\{tenantId\}_\$\{u\}`;[\s\S]*?\/\/ Keep individual identities in metadata[\s\S]*?const uMetadata = \{ \.\.\.metadata \};[\s\S]*?uMetadata\.email = u;[\s\S]*?uMetadata\.name = u === 'zulune@nkangaladm\.gov\.za' \? 'Noluthando Zulu' : 'Nompumelelo P\. Nsibande';[\s\S]*?uMetadata\.position = u === 'zulune@nkangaladm\.gov\.za' \? 'PMS Officer' : 'PMS Unit Member';[\s\S]*?const \{ error \} = await supabase[\s\S]*?\.from\('messages'\)[\s\S]*?\.upsert\(\{[\s\S]*?id: uDocId,[\s\S]*?tenant_id: tenantId,[\s\S]*?sender_id: 'pplan_editor_tool',[\s\S]*?sender_email: 'pplan@system\.local',[\s\S]*?sender_name: 'PPLAN Editor',[\s\S]*?content: JSON\.stringify\(\{ metadata: uMetadata, items \}\),[\s\S]*?message_type: 'pplan_list',[\s\S]*?created_at: new Date\(\)\.toISOString\(\)[\s\S]*?\}\);[\s\S]*?if \(error\) throw error;[\s\S]*?pplanCache\.delete\(uDocId\);[\s\S]*?\}/;

const postPplanReplacement = `const uDocId = \`pplan_\${tenantId}_\${userId}\`;
      const { error } = await supabase
        .from('messages')
        .upsert({ 
          id: uDocId,
          tenant_id: tenantId,
          sender_id: 'pplan_editor_tool',
          sender_email: 'pplan@system.local',
          sender_name: 'PPLAN Editor',
          content: JSON.stringify({ metadata, items }),
          message_type: 'pplan_list',
          created_at: new Date().toISOString()
        });
        
      if (error) throw error;
      pplanCache.delete(uDocId);`;

code = code.replace(postPplanSyncRegex, postPplanReplacement);

const getPplanSyncRegex = /\/\/ Replicate data for the PMS Team members \(zulune and nsibandenp\)[\s\S]*?if \(SYNCED_EMAILS\.includes\(userId\)\) \{[\s\S]*?const id1 = `pplan_\$\{tenantId\}_zulune@nkangaladm\.gov\.za`;[\s\S]*?const id2 = `pplan_\$\{tenantId\}_nsibandenp@nkangaladm\.gov\.za`;[\s\S]*?const \{ data: res1 \} = await supabase\.from\('messages'\)\.select\('content'\)\.eq\('id', id1\)\.maybeSingle\(\);[\s\S]*?const \{ data: res2 \} = await supabase\.from\('messages'\)\.select\('content'\)\.eq\('id', id2\)\.maybeSingle\(\);[\s\S]*?let bestContent = null;[\s\S]*?if \(res1 && res1\.content\) \{[\s\S]*?bestContent = res1\.content; \/\/ Always use Zulune as master for synced users[\s\S]*?\} else if \(res2 && res2\.content\) \{[\s\S]*?bestContent = res2\.content;[\s\S]*?\}[\s\S]*?if \(bestContent\) \{[\s\S]*?try \{[\s\S]*?const parsed = JSON\.parse\(bestContent\);[\s\S]*?parsed\.metadata = parsed\.metadata \|\| \{\};[\s\S]*?parsed\.metadata\.email = userId;[\s\S]*?parsed\.metadata\.name = userId === 'zulune@nkangaladm\.gov\.za' \? 'Noluthando Zulu' : 'Nompumelelo P\. Nsibande';[\s\S]*?parsed\.metadata\.position = userId === 'zulune@nkangaladm\.gov\.za' \? 'PMS Officer' : 'PMS Unit Member';[\s\S]*?return res\.json\(parsed\);[\s\S]*?\} catch \(e\) \{\}[\s\S]*?\}[\s\S]*?\}/;

code = code.replace(getPplanSyncRegex, '');

fs.writeFileSync('server.ts', code);
console.log('Patched server.ts successfully');
