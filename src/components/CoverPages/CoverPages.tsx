export function CoverPages({ currentUser, activeTenantId }: CoverPagesProps) {
  const [isFrontPage, setIsFrontPage] = useState<boolean>(true);
  
  // Design content states
  const currentMunicipality = tenants.find(t => t.id === activeTenantId)?.name || 'Default Local Municipality';
  const [municipalityName, setMunicipalityName] = useState<string>(currentMunicipality);
  const [documentType, setDocumentType] = useState<string>('Annual Performance Report');
  const [financialYear, setFinancialYear] = useState<string>('2023/2024');
  const [documentTitle, setDocumentTitle] = useState<string>('INTEGRATED DEVELOPMENT PLAN (IDP)');
  const [documentSubtitle, setDocumentSubtitle] = useState<string>('FIVE-YEAR STRATEGIC ROADMAP AND PERFORMANCE METRICS');
  const [selectedLogo, setSelectedLogo] = useState<string>('default');
  const [titleFont, setTitleFont] = useState<string>('Space Grotesk');
  
  // Font sizes sliders
  const [titleFontSize, setTitleFontSize] = useState<number>(32);
  const [muniFontSize, setMuniFontSize] = useState<number>(18);
  const [finYearFontSize, setFinYearFontSize] = useState<number>(14);
  const [docTitleFontSize, setDocTitleFontSize] = useState<number>(20);
  const [docSubtitleFontSize, setDocSubtitleFontSize] = useState<number>(14);
  const [compiledDateFontSize, setCompiledDateFontSize] = useState<number>(11);
  const [signOffMMFontSize, setSignOffMMFontSize] = useState<number>(12);

  // Logo Scale adjustments
  const [logoScale, setLogoScale] = useState<number>(100);
  const [backLogoScale, setBackLogoScale] = useState<number>(100);

  // Dynamic Border width for designs/frames (classic / editorial borders)
  const [borderPixel, setBorderPixel] = useState<number>(12);

  // Background pattern density/scale setup
  const [backPatternScale, setBackPatternScale] = useState<number>(16);

  // Direct element color selectors
  const [muniColor, setMuniColor] = useState<string>('#ffffff');
  const [titleColor, setTitleColor] = useState<string>('#ffffff');
  const [finYearColor, setFinYearColor] = useState<string>('#ca8a04'); // default gold
  const [textColor, setTextColor] = useState<string>('#cbd5e1');
  const [tintColor, setTintColor] = useState<string>('#0f172a'); // default ambient dark slate tint

  const [primaryColor, setPrimaryColor] = useState<string>('#15803d'); // Emerald base
  const [secondaryColor, setSecondaryColor] = useState<string>('#ca8a04'); // Gold base
  
  // Independent picture uploads for Front & Back captures
  const [bgImage, setBgImage] = useState<string>(DEFAULT_BG);
  const [customBgImage, setCustomBgImage] = useState<string>('');
  
  const [backBgImage, setBackBgImage] = useState<string>(DEFAULT_BACK_BG);
  const [customBackBgImage, setCustomBackBgImage] = useState<string>('');
  
  const [coverDesign, setCoverDesign] = useState<string>('modern');
  const [isConfidential, setIsConfidential] = useState<boolean>(false);
  const [confidentialText, setConfidentialText] = useState<string>('Confidential');
  const [confidentialStyle, setConfidentialStyle] = useState<string>('red-badge');
  const [confidentialPos, setConfidentialPos] = useState<string>('top-right');
  const [fadePosition, setFadePosition] = useState<number>(50);
  const [overlayOpacity, setOverlayOpacity] = useState<number>(40);
  const [signOffMM, setSignOffMM] = useState<string>('Mr. S. M. Gcobani (Accounting Officer)');

  // Fully Editable Labels & Dates
  const [compiledDate, setCompiledDate] = useState<string>('June 2026');
  const [backPreparedBy, setBackPreparedBy] = useState<string>('Prepared by Mzansi Flow Automated PMS System');
  const [backOfficeLabel, setBackOfficeLabel] = useState<string>('Accounting Office');
  const [backSignOffPerson, setBackSignOffPerson] = useState<string>('Mandla L Mahlangu');
  const [backRights, setBackRights] = useState<string>('All Rights Reserved');
  const [backSystemGenerated, setBackSystemGenerated] = useState<string>('System Generated');

  // Back Cover Page custom typography & style state variables
  const [backFont, setBackFont] = useState<string>('Space Grotesk');
  const [backMuniFontSize, setBackMuniFontSize] = useState<number>(14);
  const [backTitleFontSize, setBackTitleFontSize] = useState<number>(28);
  const [backFinYearFontSize, setBackFinYearFontSize] = useState<number>(12);
  const [backPreparedByFontSize, setBackPreparedByFontSize] = useState<number>(12);
  const [backOfficeFontSize, setBackOfficeFontSize] = useState<number>(11);
  const [backSignOffFontSize, setBackSignOffFontSize] = useState<number>(18);
  const [backRightsFontSize, setBackRightsFontSize] = useState<number>(10);
  const [backSystemGeneratedFontSize, setBackSystemGeneratedFontSize] = useState<number>(10);

  const [backMuniColor, setBackMuniColor] = useState<string>('#0f172a');
  const [backTitleColor, setBackTitleColor] = useState<string>('#1e293b');
  const [backFinYearColor, setBackFinYearColor] = useState<string>('#ca8a04');
  const [backPreparedByColor, setBackPreparedByColor] = useState<string>('#475569');
  const [backOfficeLabelColor, setBackOfficeLabelColor] = useState<string>('#94a3b8');
  const [backSignOffColor, setBackSignOffColor] = useState<string>('#0f172a');
  const [backRightsColor, setBackRightsColor] = useState<string>('#64748b');
  const [backSystemGeneratedColor, setBackSystemGeneratedColor] = useState<string>('#15803d');

  const [backBgOpacity, setBackBgOpacity] = useState<number>(35);
  const [backBgBlur, setBackBgBlur] = useState<number>(0);
  const [backPattern, setBackPattern] = useState<string>('none');

  const [uploadedBackgrounds, setUploadedBackgrounds] = useState<{id: string; name: string; url: string}[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [showExportMenu, setShowExportMenu] = useState<boolean>(false);

  const [isPushing, setIsPushing] = useState<string | null>(null);
  const [pushStatus, setPushStatus] = useState<string | null>(null);
  const [isPushingImage, setIsPushingImage] = useState<boolean>(false);

  // Auto update when activeTenantId changes
  useEffect(() => {
    setMunicipalityName(currentMunicipality);
  }, [activeTenantId]);

  // Load configuration
  useEffect(() => {
    let active = true;
    const fetchConfig = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/tenant/${activeTenantId}/coverpages`);
        if (response.ok) {
          const list = await response.json();
          const currentConfig = list.find((item: any) => item.userEmail === currentUser.email);
          if (currentConfig && currentConfig.config && active) {
            const cfg = currentConfig.config;
            setMunicipalityName(cfg.municipalityName || currentMunicipality);
            setDocumentType(cfg.documentType || 'Annual Performance Report');
            setFinancialYear(cfg.financialYear || '2023/2024');
            setDocumentTitle(cfg.documentTitle || 'INTEGRATED DEVELOPMENT PLAN (IDP)');
            setDocumentSubtitle(cfg.documentSubtitle || '');
            setSelectedLogo(cfg.selectedLogo || 'gold-crest');
            setTitleFont(cfg.titleFont || 'Space Grotesk');
            
            setTitleFontSize(cfg.titleFontSize || 32);
            setMuniFontSize(cfg.muniFontSize || 18);
            setFinYearFontSize(cfg.finYearFontSize || 14);
            
            setDocTitleFontSize(cfg.docTitleFontSize !== undefined ? Number(cfg.docTitleFontSize) : 20);
            setDocSubtitleFontSize(cfg.docSubtitleFontSize !== undefined ? Number(cfg.docSubtitleFontSize) : 14);
            setCompiledDateFontSize(cfg.compiledDateFontSize !== undefined ? Number(cfg.compiledDateFontSize) : 11);
            setSignOffMMFontSize(cfg.signOffMMFontSize !== undefined ? Number(cfg.signOffMMFontSize) : 12);
            setLogoScale(cfg.logoScale !== undefined ? Number(cfg.logoScale) : 100);
            setBackLogoScale(cfg.backLogoScale !== undefined ? Number(cfg.backLogoScale) : 100);
            setBorderPixel(cfg.borderPixel !== undefined ? Number(cfg.borderPixel) : 12);
            setBackPatternScale(cfg.backPatternScale !== undefined ? Number(cfg.backPatternScale) : 16);
            setMuniColor(cfg.muniColor || '#ffffff');
            setTitleColor(cfg.titleColor || '#ffffff');
            setFinYearColor(cfg.finYearColor || '#ca8a04');
            setTextColor(cfg.textColor || '#cbd5e1');
            setTintColor(cfg.tintColor || '#0f172a');

            setPrimaryColor(cfg.primaryColor || '#15803d');
            setSecondaryColor(cfg.secondaryColor || '#ca8a04');
            setBgImage(cfg.bgImage || DEFAULT_BG);
            setCustomBgImage(cfg.customBgImage || '');
            
            setBackBgImage(cfg.backBgImage || DEFAULT_BACK_BG);
            setCustomBackBgImage(cfg.customBackBgImage || '');
            
            setCoverDesign(cfg.coverDesign || 'modern');
            setIsConfidential(cfg.isConfidential !== undefined ? cfg.isConfidential : false);
            setConfidentialText(cfg.confidentialText || 'Confidential');
            setConfidentialStyle(cfg.confidentialStyle || 'red-badge');
            setConfidentialPos(cfg.confidentialPos || 'top-right');
            setFadePosition(cfg.fadePosition !== undefined ? Number(cfg.fadePosition) : 50);
            setOverlayOpacity(cfg.overlayOpacity !== undefined ? Number(cfg.overlayOpacity) : 40);
            setSignOffMM(cfg.signOffMM || 'Mr. S. M. Gcobani (Accounting Officer)');
            
            setCompiledDate(cfg.compiledDate || 'June 2026');
            setBackPreparedBy(cfg.backPreparedBy || 'Prepared by Mzansi Flow Automated PMS System');
            setBackOfficeLabel(cfg.backOfficeLabel || 'Accounting Office');
            setBackSignOffPerson(cfg.backSignOffPerson || 'Mandla L Mahlangu');
            setBackRights(cfg.backRights || 'All Rights Reserved');
            setBackSystemGenerated(cfg.backSystemGenerated || 'System Generated');

            // Restore custom styling details for back cover
            setBackFont(cfg.backFont || 'Space Grotesk');
            setBackMuniFontSize(cfg.backMuniFontSize !== undefined ? Number(cfg.backMuniFontSize) : 14);
            setBackTitleFontSize(cfg.backTitleFontSize !== undefined ? Number(cfg.backTitleFontSize) : 28);
            setBackFinYearFontSize(cfg.backFinYearFontSize !== undefined ? Number(cfg.backFinYearFontSize) : 12);
            setBackPreparedByFontSize(cfg.backPreparedByFontSize !== undefined ? Number(cfg.backPreparedByFontSize) : 12);
            setBackOfficeFontSize(cfg.backOfficeFontSize !== undefined ? Number(cfg.backOfficeFontSize) : 11);
            setBackSignOffFontSize(cfg.backSignOffFontSize !== undefined ? Number(cfg.backSignOffFontSize) : 18);
            setBackRightsFontSize(cfg.backRightsFontSize !== undefined ? Number(cfg.backRightsFontSize) : 10);
            setBackSystemGeneratedFontSize(cfg.backSystemGeneratedFontSize !== undefined ? Number(cfg.backSystemGeneratedFontSize) : 10);

            setBackMuniColor(cfg.backMuniColor || '#0f172a');
            setBackTitleColor(cfg.backTitleColor || '#1e293b');
            setBackFinYearColor(cfg.backFinYearColor || '#ca8a04');
            setBackPreparedByColor(cfg.backPreparedByColor || '#475569');
            setBackOfficeLabelColor(cfg.backOfficeLabelColor || '#94a3b8');
            setBackSignOffColor(cfg.backSignOffColor || '#0f172a');
            setBackRightsColor(cfg.backRightsColor || '#64748b');
            setBackSystemGeneratedColor(cfg.backSystemGeneratedColor || '#15803d');

            setBackBgOpacity(cfg.backBgOpacity !== undefined ? Number(cfg.backBgOpacity) : 35);
            setBackBgBlur(cfg.backBgBlur !== undefined ? Number(cfg.backBgBlur) : 0);
            setBackPattern(cfg.backPattern || 'none');
          }
        }

        const bgResponse = await fetch(`/api/tenant/${activeTenantId}/coverpages/images`);
        if (bgResponse.ok) {
           const bglist = await bgResponse.json();
           if (active) setUploadedBackgrounds(bglist);
        }
      } catch (err) {
        console.error('Error fetching cover configuration:', err);
      } finally {
        if (active) setIsLoading(false);
      }
    };

    fetchConfig();
    return () => {
      active = false;
    };
  }, [activeTenantId, currentUser.email]);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      const payload = {
        config: {
          municipalityName,
          documentType,
          financialYear,
          documentTitle,
          documentSubtitle,
          selectedLogo,
          titleFont,
          
          titleFontSize,
          muniFontSize,
          finYearFontSize,
          docTitleFontSize,
          docSubtitleFontSize,
          compiledDateFontSize,
          signOffMMFontSize,
          logoScale,
          backLogoScale,
          borderPixel,
          backPatternScale,
          
          muniColor,
          titleColor,
          finYearColor,
          textColor,
          tintColor,

          primaryColor,
          secondaryColor,
          bgImage,
          customBgImage,
          
          backBgImage,
          customBackBgImage,
          
          coverDesign,
          isConfidential,
          confidentialText,
          confidentialStyle,
          confidentialPos,
          fadePosition,
          overlayOpacity,
          signOffMM,
          compiledDate,
          backPreparedBy,
          backOfficeLabel,
          backSignOffPerson,
          backRights,
          backSystemGenerated,
          
          // Back typography & styles
          backFont,
          backMuniFontSize,
          backTitleFontSize,
          backFinYearFontSize,
          backPreparedByFontSize,
          backOfficeFontSize,
          backSignOffFontSize,
          backRightsFontSize,
          backSystemGeneratedFontSize,
          
          backMuniColor,
          backTitleColor,
          backFinYearColor,
          backPreparedByColor,
          backOfficeLabelColor,
          backSignOffColor,
          backRightsColor,
          backSystemGeneratedColor,
          
          backBgOpacity,
          backBgBlur,
          backPattern
        },
        userEmail: currentUser.email,
        userName: currentUser.name
      };

      await fetch(`/api/tenant/${activeTenantId}/coverpages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (e) {
      console.error('Failed to save cover layout:', e);
    } finally {
      setIsSaving(false);
    }
  };

  const currentBgImage = customBgImage ? customBgImage : bgImage;
  const currentBackBgImageValue = customBackBgImage ? customBackBgImage : backBgImage;

  // --- HTML Builders for compliant adoptions ---
  const buildFrontCoverHtml = () => {
    const currentBg = customBgImage ? customBgImage : bgImage;
    if (coverDesign === 'graphic-full-bleed') {
      return `
        <div style="font-family: inherit; width: 100%; height: 100%; min-height: 1120px; padding: 0; margin: 0; background-image: url('${currentBg}'); background-size: cover; background-position: center; background-repeat: no-repeat; border-radius: 0;">
        </div>
      `;
    }

    let bgStyle = '';
    let contentHtml = '';

    if (coverDesign === 'modern') {
      bgStyle = `background: linear-gradient(to top, ${tintColor} 0%, rgba(15,23,42,0.95) ${Math.max(0, fadePosition - 20)}%, rgba(15,23,42,0.4) ${fadePosition}%, rgba(15,23,42,0.1) 100%), url('${currentBg}') center/cover no-repeat;`;
      contentHtml = `
        <div style="display: flex; justify-content: space-between; align-items: flex-start; width: 100%; margin-bottom: 200px;">
          <div style="width: ${80 * (logoScale / 100)}px; height: ${80 * (logoScale / 100)}px; background-color: rgba(255,255,255,0.1); backdrop-filter: blur(8px); border: 1px solid rgba(255,255,255,0.2); border-radius: 12px; display: flex; align-items: center; justify-content: center; padding: 8px;">
            ${selectedLogo && selectedLogo !== 'default' ? `<img src="${selectedLogo}" style="max-width: 100%; max-height: 100%; object-fit: contain;" />` : ''}
          </div>
          <div style="font-size: ${finYearFontSize}px; font-weight: 800; color: ${finYearColor}; background-color: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.15); padding: 5px 12px; border-radius: 9999px; letter-spacing: 0.1em; text-transform: uppercase;">
            ${financialYear}
          </div>
        </div>
        <div style="text-align: left; margin-top: auto; margin-bottom: 40px;">
          <p style="font-size: ${muniFontSize}px; font-weight: 900; letter-spacing: 0.25em; text-transform: uppercase; color: ${muniColor}; margin-bottom: 8px;">
            ${municipalityName}
          </p>
          <h1 style="font-size: ${titleFontSize}px; font-weight: 850; line-height: 1.15; color: ${titleColor}; text-transform: uppercase; margin-bottom: 12px; letter-spacing: -0.02em;">
            ${documentType}
          </h1>
          ${documentTitle ? `<p style="font-size: ${docTitleFontSize}px; font-weight: 600; color: ${textColor}; margin-top: 4px;">${documentTitle}</p>` : ''}
          <p style="font-size: ${compiledDateFontSize}px; color: ${textColor}; font-weight: bold; margin-top: 12px;">
            Compiled: ${compiledDate}
          </p>
          <div style="width: 100px; height: 4px; background-color: ${primaryColor}; margin-top: 20px; border-radius: 99px;"></div>
        </div>
      `;
    } else if (coverDesign === 'classic') {
      bgStyle = `background-color: #ffffff; border-top: ${borderPixel}px solid ${primaryColor}; border-bottom: ${borderPixel}px solid ${secondaryColor};`;
      contentHtml = `
        <div style="width: 100%; height: auto; text-align: center; margin-top: 60px;">
          <div style="width: ${120 * (logoScale / 100)}px; height: ${120 * (logoScale / 100)}px; margin: 0 auto 40px; display: flex; align-items: center; justify-content: center;">
            ${selectedLogo && selectedLogo !== 'default' ? `<img src="${selectedLogo}" style="max-width: 100%; max-height: 100%; object-fit: contain;" />` : ''}
          </div>
          <h2 style="font-size: ${muniFontSize}px; font-weight: 700; letter-spacing: 0.2em; text-transform: uppercase; color: ${muniColor}; border-bottom: 1px solid #e2e8f0; padding-bottom: 16px; margin-bottom: 24px;">
            ${municipalityName}
          </h2>
          <h1 style="font-size: ${titleFontSize}px; font-weight: 900; color: ${titleColor}; margin-bottom: 12px; text-transform: uppercase; line-height: 1.1;">
            ${documentType}
          </h1>
          <h3 style="font-size: ${docTitleFontSize}px; color: ${textColor}; font-weight: 600; margin-bottom: 32px;">
            ${documentTitle}
          </h3>
          <div style="display: inline-block; padding: 6px 18px; background-color: ${primaryColor}15; color: ${finYearColor}; font-weight: 800; font-size: ${finYearFontSize}px; border-radius: 9999px; text-transform: uppercase; letter-spacing: 0.05em;">
            Financial Cycle ${financialYear}
          </div>
          <p style="font-size: ${compiledDateFontSize}px; color: ${textColor}; font-weight: bold; margin-top: 40px;">
            Date: ${compiledDate}
          </p>
        </div>
      `;
    } else {
      // General fallbacks applying custom sizes and colors perfectly
      bgStyle = `background: url('${currentBg}') center/cover no-repeat;`;
      contentHtml = `
        <div style="text-align: center; margin-top: 80px;">
          <p style="font-size: ${muniFontSize}px; color: ${muniColor}; font-weight: 800; text-transform: uppercase; margin-bottom: 10px;">${municipalityName}</p>
          <h1 style="font-size: ${titleFontSize}px; color: ${titleColor}; font-weight: 950; margin-bottom: 15px;">${documentType}</h1>
          <p style="font-size: ${finYearFontSize}px; color: ${finYearColor}; font-weight: 800;">${financialYear}</p>
        </div>
      `;
    }

    return `
      <div style="font-family: '${titleFont}', system-ui, sans-serif; position: relative; width: 100%; height: 100%; min-height: 1120px; padding: 60px; box-sizing: border-box; display: flex; flex-direction: column; justify-content: space-between; overflow: hidden; ${bgStyle}">
        ${contentHtml}
      </div>
    `;
  };

  const buildBackCoverHtml = () => {
    const currentBackBg = customBackBgImage ? customBackBgImage : backBgImage;
    return `
      <div style="font-family: '${titleFont}', system-ui, sans-serif; position: relative; width: 100%; height: 100%; min-height: 1120px; padding: 60px; box-sizing: border-box; display: flex; flex-direction: column; justify-content: space-between; background: linear-gradient(to bottom, rgba(255,255,255,0.9), rgba(255,255,255,0.95)), url('${currentBackBg}') center/cover no-repeat; border-top: 8px solid ${primaryColor};">
        <div style="margin-bottom: auto; padding-bottom: 40px; border-bottom: 1px solid #e2e8f0;">
          <div style="width: 70px; height: 70px; margin-bottom: 24px; filter: grayscale(1);">
            ${selectedLogo && selectedLogo !== 'default' ? `<img src="${selectedLogo}" style="width: 100%; height: 100%; object-fit: contain;" />` : ''}
          </div>
          <h3 style="font-size: 24px; font-weight: 850; color: #0b1e36; margin-bottom: 6px; text-transform: uppercase;">
            ${documentType}
          </h3>
          <p style="font-size: 12px; font-weight: bold; text-transform: uppercase; color: #64748b; letter-spacing: 0.1em; margin: 0;">
            Financial Cycle ${financialYear}
          </p>
        </div>

        <div style="margin-top: 40px; margin-bottom: 40px; display: flex; flex-direction: column; gap: 16px;">
          <p style="font-size: 13px; color: #475569; font-weight: 600; margin: 0;">
            ${backPreparedBy}
          </p>
          <div style="background-color: #ffffff; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; display: inline-block; align-self: flex-start;">
            <p style="font-size: 10px; color: #94a3b8; font-weight: bold; text-transform: uppercase; margin-bottom: 4px;">
              ${backOfficeLabel}
            </p>
            <p style="font-size: 18px; font-weight: 850; color: #0f172a; text-transform: uppercase; margin: 0;">
              ${backSignOffPerson}
            </p>
          </div>
        </div>

        <div style="border-top: 1px solid #e2e8f0; padding-top: 24px; display: flex; justify-content: space-between; align-items: center; font-size: 11px; color: #64748b; font-weight: bold; text-transform: uppercase;">
          <div>
            <p style="color: #0b1e36; margin: 0 0 2px 0;">${municipalityName}</p>
            <p style="font-size: 9px; color: #94a3b8; margin: 0;">${backRights}</p>
          </div>
          <div style="text-align: right;">
            <p style="color: ${primaryColor}; margin: 0;">${backSystemGenerated}</p>
          </div>
        </div>
      </div>
    `;
  };

  const handlePushToModule = async (moduleKey: 'ar' | 'apr' | 'idp' | 'sdbip', label: string) => {
    setIsPushing(moduleKey);
    setPushStatus('Generating Cover Designs...');
    
    const frontHtml = buildFrontCoverHtml();
    const backHtml = buildBackCoverHtml();
    
    const targetDocId = activeTenantId === 'global' ? `${moduleKey}-global` : `${moduleKey}-${activeTenantId}`;
    const ssoToken = localStorage.getItem("azure_ad_token") || "simulated_azure_ad_jwt_claims_token_val_active";
    
    try {
      setPushStatus('Retrieving Remote Document...');
      let targetChapters: string[] = [];
      const res = await fetch(`/api/documents/${targetDocId}/chapters`, {
        headers: { 'Authorization': `Bearer ${ssoToken}` }
      });
      
      if (res.ok) {
        const data = await res.json();
        if (data.chapters && Array.isArray(data.chapters)) {
          targetChapters = [...data.chapters];
        }
      }
      
      if (targetChapters.length === 0) {
        setPushStatus(`Creating new 850-page ${label} drafting document...`);
        targetChapters = [];
        targetChapters.push(frontHtml);
        
        targetChapters.push(`
          <div style="font-family: inherit; color: #1e293b; padding: 24px;">
            <h2 style="font-size: 22px; font-weight: 850; color: #0f172a; border-bottom: 2px solid #3b82f6; padding-bottom: 8px; margin-bottom: 24px; text-transform: uppercase; letter-spacing: 0.05em;">
              Table of Compliance Sections
            </h2>
            <div style="display: flex; flex-direction: column; gap: 14px; font-size: 12px; margin-top: 16px;">
              <p>Section 1: Governing Review - Page 3</p>
              <p>Section 2: Performance Achievements - Page 4</p>
              <p>Section 3-850: Compliance Annexures - Pages 5-850</p>
            </div>
          </div>
        `);
        
        for (let i = 2; i < 849; i++) {
          targetChapters.push(`
            <div style="font-family: inherit; line-height: 1.6; color: #334155; padding: 20px;">
              <h3 style="font-size: 13px; font-weight: 850; color: #0b1e36; border-bottom: 1px solid #cbd5e1; padding-bottom: 6px; margin-bottom: 14px; text-transform: uppercase;">
                ${label} Compliance - Slide Page ${i + 1}
              </h3>
              <p style="font-size: 12px; margin-bottom: 14px;">
                Statutory regulatory draft for the local municipality accounts. Use the Drafting Suite to customize this.
              </p>
            </div>
          `);
        }
        
        targetChapters.push(backHtml);
      } else {
        setPushStatus(`Updating Front Cover & Back Cover in ${label}...`);
        targetChapters[0] = frontHtml;
        while (targetChapters.length < 5) {
          targetChapters.push('<p><br/></p>');
        }
        targetChapters[targetChapters.length - 1] = backHtml;
      }
      
      setPushStatus('Pushing to Supabase Cloud Storage...');
      const pushRes = await fetch(`/api/documents/${targetDocId}/chapters`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${ssoToken}` 
        },
        body: JSON.stringify({ chapters: targetChapters })
      });
      
      if (pushRes.ok) {
        setPushStatus('ADOPTED PERFECTLY!');
        setIsPushing(null);
        setTimeout(() => setPushStatus(null), 3050);
      } else {
        const err = await pushRes.json();
        setPushStatus(`PIPELINE ERROR: ${err.error || 'Push failure'}`);
        setTimeout(() => setPushStatus(null), 5000);
      }
    } catch (e: any) {
      console.error(e);
      setPushStatus(`SYSTEM OFFLINE EXCEPTION: ${e.message}`);
      setTimeout(() => setPushStatus(null), 5000);
    } finally {
      setIsPushing(null);
    }
  };

  const handlePushDesignAsImage = async () => {
    setIsPushingImage(true);
    setPushStatus('Rendering high-fidelity preview...');
    try {
      const elementId = isFrontPage ? 'front-page-capture' : 'back-page-capture';
      const element = document.getElementById(elementId);
      if (!element) {
        throw new Error('Preview element not found');
      }

      // Ensure all fonts and images are fully loaded and decoded prior to capture
      setPushStatus('Ensuring all assets are fully rendered...');
      await document.fonts.ready;
      const images = Array.from(element.getElementsByTagName('img'));
      await Promise.all(
        images.map(img => {
          if (img.complete) return Promise.resolve();
          return new Promise((resolve) => {
            img.onload = resolve;
            img.onerror = resolve;
          });
        })
      );

      setPushStatus('Capturing canvas with html2canvas...');
      const canvas = await html2canvas(element, {
        scale: 2.0,
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#ffffff',
        logging: false,
        onclone: onCloneHtml2Canvas
      });

      setPushStatus('Encoding visual template as data URL...');
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);

      setPushStatus('Uploading template image to Supabase...');
      const response = await fetch(`/api/tenant/${activeTenantId}/coverpages/images`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userEmail: currentUser.email,
          fileName: `Designed Cover - ${isFrontPage ? 'Front' : 'Back'} - ${documentType || 'Annual Report'}`,
          fileData: dataUrl
        })
      });

      if (response.ok) {
        setPushStatus('PUSHED PERFECTLY! Available in Cover Images dropdown inside Drafting Suite.');
        setTimeout(() => setPushStatus(null), 5000);
      } else {
        const err = await response.json();
        setPushStatus(`UPLOAD ERROR: ${err.error || 'Failed to save'}`);
        setTimeout(() => setPushStatus(null), 4000);
      }
    } catch (err: any) {
      console.error(err);
      setPushStatus(`ERROR: ${err.message}`);
      setTimeout(() => setPushStatus(null), 4000);
    } finally {
      setIsPushingImage(false);
    }
  };

  const handleBgUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsLoading(true);

    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await fetch(`/api/tenant/${activeTenantId}/coverpages/images`, {
        method: 'POST',
        body: formData
      });
      if (response.ok) {
        const result = await response.json();
        if (isFrontPage) {
          setCustomBgImage(result.url);
          setBgImage(result.url);
        } else {
          setCustomBackBgImage(result.url);
          setBackBgImage(result.url);
        }
        const refetch = await fetch(`/api/tenant/${activeTenantId}/coverpages/images`);
        if (refetch.ok) {
          const list = await refetch.json();
          setUploadedBackgrounds(list);
        }
      }
    } catch (err) {
      console.error('Failed to upload background image:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportPDF = async (pageType: 'front' | 'back' | 'both') => {
    setIsExporting(true);
    try {
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      const pdfWidth = 210;
      const pdfHeight = 297;

      const capturePage = async (elementId: string) => {
        const element = document.getElementById(elementId);
        if (!element) return '';
        const originalTransition = element.style.transition;
        element.style.transition = 'none';
        
        // Ensure web fonts and image elements are fully fetched and primed
        await document.fonts.ready;
        const imgElements = Array.from(element.getElementsByTagName('img'));
        await Promise.all(
          imgElements.map(img => {
            if (img.complete) return Promise.resolve();
            return new Promise((resolve) => {
              img.onload = resolve;
              img.onerror = resolve;
            });
          })
        );

        const canvas = await html2canvas(element, {
          scale: 2.5, // Crisp high-res capture
          useCORS: true,
          allowTaint: false,
          backgroundColor: '#ffffff',
          logging: false,
          onclone: onCloneHtml2Canvas
        });
        
        element.style.transition = originalTransition;
        return canvas.toDataURL('image/jpeg', 0.95);
      };

      if (pageType === 'front') {
        const imgData = await capturePage('front-page-capture');
        if (imgData) pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`Cover_Page_Front_${municipalityName.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
      } else if (pageType === 'back') {
        const imgData = await capturePage('back-page-capture');
        if (imgData) pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`Cover_Page_Back_${municipalityName.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
      } else if (pageType === 'both') {
        const frontImg = await capturePage('front-page-capture');
        if (frontImg) pdf.addImage(frontImg, 'JPEG', 0, 0, pdfWidth, pdfHeight);
        
        pdf.addPage();
        const backImg = await capturePage('back-page-capture');
        if (backImg) pdf.addImage(backImg, 'JPEG', 0, 0, pdfWidth, pdfHeight);
        
        pdf.save(`Cover_Pages_Full_Set_${municipalityName.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
      }
    } catch (error) {
      console.error('Failed to export PDF:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportImage = async (format: 'png' | 'jpg' | 'jpeg') => {
    setIsExporting(true);
    try {
      const elementId = isFrontPage ? 'front-page-capture' : 'back-page-capture';
      const element = document.getElementById(elementId);
      if (!element) return;

      // Ensure web fonts and image elements are fully fetched and primed
      await document.fonts.ready;
      const imgElements = Array.from(element.getElementsByTagName('img'));
      await Promise.all(
        imgElements.map(img => {
          if (img.complete) return Promise.resolve();
          return new Promise((resolve) => {
            img.onload = resolve;
            img.onerror = resolve;
          });
        })
      );

      const canvas = await html2canvas(element, {
        scale: 2.5,
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#ffffff',
        logging: false,
        onclone: onCloneHtml2Canvas
      });

      const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';
      const fileExt = format;
      const dataUrl = canvas.toDataURL(mimeType, 0.95);
      const link = document.createElement('a');
      link.download = `Cover_Page_${isFrontPage ? 'Front' : 'Back'}_${municipalityName.replace(/[^a-zA-Z0-9]/g, '_')}.${fileExt}`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error(`Failed to export ${format} image:`, error);
    } finally {
      setIsExporting(false);
    }
  };

  // --- MS Word Compliance Document exporter ---
  const handleExportWord = (pageType: 'front' | 'back' | 'both') => {
    let content = '';
    if (pageType === 'front' || pageType === 'both') {
      content += buildFrontCoverHtml();
    }
    if (pageType === 'both') {
      content += '<br clear="all" style="page-break-before: always" />';
    }
    if (pageType === 'back' || pageType === 'both') {
      content += buildBackCoverHtml();
    }

    const html = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <title>Compliance Cover Page</title>
        <!--[if gte mso 9]>
        <xml>
        <w:WordDocument>
        <w:View>Print</w:View>
        <w:Zoom>100</w:Zoom>
        <w:DoNotOptimizeForBrowser/>
        </w:WordDocument>
        </xml>
        <![endif]-->
        <style>
          @page {
            size: 210mm 297mm;
            margin: 0mm;
          }
          body {
            margin: 0;
            padding: 0;
            background-color: #ffffff;
          }
        </style>
      </head>
      <body>
        ${content}
      </body>
      </html>
    `;

    const blob = new Blob([html], { type: 'application/msword;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Cover_Page_${pageType}_${municipalityName.replace(/[^a-zA-Z0-9]/g, '_')}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const renderConfidentialStamp = () => {
    return null; // Removed per user request to hide confidential badge
  };

  return (
    <div id="cover_page_workspace" className="h-full flex flex-col font-sans text-slate-800 bg-[#fdfdfd]">
      
      {/* HEADER BAR */}
      <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between shrink-0 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-400 flex items-center justify-center shadow-lg">
            <LayoutTemplate className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-black tracking-tight uppercase">Redesigned Cover Page Module</h1>
            <p className="text-[10px] text-indigo-300 font-mono tracking-wider font-bold">MUTABLE DUAL PICTURE INTERACTIVE STYLER</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {saveSuccess && (
            <div className="text-xs bg-emerald-500/20 text-emerald-300 font-bold px-3 py-1 bg-emerald-600/10 border border-emerald-500/30 rounded-lg animate-fade-in flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" /> Saved to Supabase
            </div>
          )}

          {/* Export Menu Dropdown Trigger */}
          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              disabled={isExporting}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white text-xs font-black px-4 py-2.5 rounded-xl flex items-center gap-2 transition cursor-pointer select-none border border-indigo-500/30 shadow-md"
            >
              {isExporting ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Compiling...</>
              ) : (
                <><Download className="w-4 h-4" /> Export Document <ChevronDown className="w-3 h-3 ml-1 inline" /></>
              )}
            </button>

            {showExportMenu && (
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-slate-100 p-2 z-50 animate-fade-in">
                <div className="p-3 border-b border-slate-100">
                  <p className="text-xs font-black text-slate-800 uppercase tracking-widest font-mono">Download Outputs</p>
                  <p className="text-[9px] text-slate-400 font-medium">Capture exact high-res layouts to disk</p>
                </div>

                <div className="space-y-1 pt-1">
                  <button
                    onClick={() => { setShowExportMenu(false); handleExportPDF('both'); }}
                    className="w-full text-left px-3 py-2 text-xs font-bold hover:bg-indigo-50 rounded-xl flex items-center gap-2.5 text-slate-700 transition"
                  >
                    <FileText className="w-4 h-4 text-indigo-600" />
                    <div>
                      <p className="font-bold text-xs text-slate-800">Two-Page PDF Portfolio</p>
                      <p className="text-[9px] text-slate-450 font-normal">Saves Front + Back cover set combined</p>
                    </div>
                  </button>

                  <button
                    onClick={() => { setShowExportMenu(false); handleExportWord('both'); }}
                    className="w-full text-left px-3 py-2 text-xs font-bold hover:bg-blue-50 rounded-xl flex items-center gap-2.5 text-slate-700 transition"
                  >
                    <FileText className="w-4 h-4 text-blue-600" />
                    <div>
                      <p className="font-bold text-xs text-slate-800">Export Word Doc (.DOC)</p>
                      <p className="text-[9px] text-slate-450 font-normal">Generates editable MS Word document cover</p>
                    </div>
                  </button>

                  <button
                    onClick={() => { setShowExportMenu(false); handleExportImage('jpg'); }}
                    className="w-full text-left px-3 py-2 text-xs font-bold hover:bg-rose-50 rounded-xl flex items-center gap-2.5 text-slate-700 transition"
                  >
                    <Image className="w-4 h-4 text-rose-600" />
                    <div>
                      <p className="font-bold text-xs text-slate-800">Exporter High-Res JPG</p>
                      <p className="text-[9px] text-slate-450 font-normal">Render pixel graphic of current page</p>
                    </div>
                  </button>

                  <button
                    onClick={() => { setShowExportMenu(false); handleExportImage('png'); }}
                    className="w-full text-left px-3 py-2 text-xs font-bold hover:bg-amber-50 rounded-xl flex items-center gap-2.5 text-slate-700 transition"
                  >
                    <Image className="w-4 h-4 text-amber-600" />
                    <div>
                      <p className="font-bold text-xs text-slate-800">Exporter Lossless PNG</p>
                      <p className="text-[9px] text-slate-450 font-normal">Scorching pixel depth with transparencies</p>
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CORE WORKSPACE SPLITTER */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        
        {/* SIDEBAR VIEWCONTROLLERS */}
        <div className="w-96 flex flex-col border-r border-slate-200 bg-white shrink-0">
          
          <div className="flex border-b border-slate-100">
            <button
              onClick={() => setIsFrontPage(true)}
              className={cn(
                "flex-1 py-3 text-xs font-bold text-center tracking-widest uppercase transition-colors relative cursor-pointer",
                isFrontPage ? "text-slate-900 bg-slate-50 font-black" : "text-slate-400 hover:text-slate-600"
              )}
            >
              1. Front Cover Design
              {isFrontPage && <span className="absolute bottom-0 left-0 w-full h-1 bg-slate-900" />}
            </button>
            <button
              onClick={() => setIsFrontPage(false)}
              className={cn(
                "flex-1 py-3 text-xs font-bold text-center tracking-widest uppercase transition-colors relative cursor-pointer",
                !isFrontPage ? "text-slate-900 bg-slate-50 font-black" : "text-slate-400 hover:text-slate-600"
              )}
            >
              2. Back Cover Design
              {!isFrontPage && <span className="absolute bottom-0 left-0 w-full h-1 bg-slate-900" />}
            </button>
          </div>

          {/* EDIT FORM PANELS CONTROLLER */}
          <div className="flex-1 overflow-y-auto p-5 space-y-6 hide-scrollbar select-none z-10 bg-[#fbfbfa]">
            
            {/* Primary Document Metadata Setup */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-slate-850 font-bold text-sm border-b border-slate-100 pb-2">
                <Sliders className="w-4 h-4 text-indigo-600" />
                <span>Page Layout Content parameters</span>
              </div>
              
              <div className="space-y-3 font-sans">
                {/* 1) Municipality Name */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">1. Municipality Name</label>
                  <input 
                    type="text"
                    value={municipalityName}
                    onChange={e => setMunicipalityName(e.target.value)}
                    placeholder="e.g. City of Johannesburg"
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-800 outline-none focus:border-slate-400 transition-all shadow-sm"
                  />
                </div>

                {/* 2) Document Type */}
                <div className="space-y-1.5 font-sans">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">2. Document Type Label (Classification)</label>
                  <input 
                    type="text"
                    value={documentType}
                    onChange={e => setDocumentType(e.target.value)}
                    placeholder="e.g. Annual Report"
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-800 outline-none focus:border-slate-400 transition-all shadow-sm"
                  />
                </div>
                
                {/* 3) Financial Year */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">3. Performance cycle Year</label>
                  <input 
                    type="text"
                    value={financialYear}
                    onChange={e => setFinancialYear(e.target.value)}
                    placeholder="e.g. 2023/2024"
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-800 outline-none focus:border-slate-400 transition-all shadow-sm"
                  />
                </div>

                {/* Document Title (Optional Extra) */}
                <div className="space-y-1.5 pt-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Front Document Specific Title</label>
                  <input 
                    type="text"
                    value={documentTitle}
                    onChange={e => setDocumentTitle(e.target.value)}
                    placeholder="Enter specific report title..."
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-800 outline-none focus:border-slate-400 transition-all shadow-sm"
                  />
                </div>
              </div>
            </div>

            {/* Design Presets selection */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-slate-850 font-bold text-sm border-b border-slate-100 pb-2">
                <LayoutTemplate className="w-4 h-4 text-indigo-600" />
                <span>Visual Theme Presets</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'modern', name: 'Modern Glass' },
                  { id: 'classic', name: 'Classic Fade' },
                  { id: 'minimalist', name: 'Minimalist' },
                  { id: 'corporate', name: 'Corporate Grid' },
                  { id: 'editorial', name: 'Editorial Serif' },
                  { id: 'bold', name: 'Bold Graphic' },
                  { id: 'split-duo', name: 'Split Canvas' },
                  { id: 'cosmic', name: 'Cosmic Slate' },
                  { id: 'graphic-full-bleed', name: 'Canvas Full Bleed' }
                ].map(design => (
                  <button
                    key={design.id}
                    onClick={() => setCoverDesign(design.id)}
                    className={cn(
                      "px-3 py-2.5 rounded-xl border text-xs font-bold transition-all flex flex-col items-center justify-center gap-1 cursor-pointer",
                      coverDesign === design.id 
                        ? "border-slate-950 bg-slate-900 text-white shadow-md font-black" 
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    )}
                  >
                    {design.name}
                  </button>
                ))}
              </div>
            </div>

            {/* CONDITIONAL CONTROLS VIEWCONTROLLER MAPS */}
            {isFrontPage ? (
              /* ================== FRONT COVER SPECIFIC STYLE TOOLS ================== */
              <div className="space-y-6 animate-fade-in">
                
                {/* Front Layout split/fade sliders */}
                <div className="space-y-4 bg-slate-50 p-4 rounded-2xl border border-slate-200/60">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block font-mono flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-indigo-500" /> Fine-Tune Front Layout
                  </span>
                  
                  {/* Layout split/fade position offset */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <label className="font-bold text-slate-650">Layout Split/Fade Offset</label>
                      <span className="font-mono font-bold text-indigo-650">{fadePosition}%</span>
                    </div>
                    <input 
                      type="range" 
                      min="15" 
                      max="85" 
                      value={fadePosition} 
                      onChange={e => setFadePosition(Number(e.target.value))}
                      className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600" 
                    />
                  </div>

                  {/* Background opacity customizer filter */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <label className="font-bold text-slate-650">Overlay Tint Opacity</label>
                      <span className="font-mono font-bold text-indigo-650">{overlayOpacity}%</span>
                    </div>
                    <input 
                      type="range" 
                      min="0" 
                      max="100" 
                      value={overlayOpacity} 
                      onChange={e => setOverlayOpacity(Number(e.target.value))}
                      className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600" 
                    />
                  </div>
                </div>

                {/* Front Typography & Font picker */}
                <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-550 uppercase tracking-wider block font-mono">Front Font Family Picker</span>
                  <div className="space-y-1">
                    <select 
                      value={titleFont} 
                      onChange={e => setTitleFont(e.target.value)} 
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-medium text-slate-800 outline-none focus:border-slate-400 cursor-pointer shadow-sm"
                    >
                      {['Space Grotesk', 'Inter', 'Playfair Display', 'JetBrains Mono', 'Cinzel', 'Montserrat', 'Outfit', 'Georgia'].map(font => (
                        <option key={font} value={font}>{font}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Front Text Sizes Draggers */}
                <div className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-black tracking-widest uppercase text-slate-500 font-mono">Front Text Sizes (px)</span>
                  
                  {/* Municipality Name Size */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="font-bold text-slate-600">Municipality Name Size</span>
                      <span className="font-mono font-black">{muniFontSize}px</span>
                    </div>
                    <input 
                      type="range" 
                      min="10" 
                      max="45" 
                      value={muniFontSize} 
                      onChange={e => setMuniFontSize(Number(e.target.value))}
                      className="w-full h-1.2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600" 
                    />
                  </div>

                  {/* Document Type Title Size */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="font-bold text-slate-600">Document Type Size</span>
                      <span className="font-mono font-black">{titleFontSize}px</span>
                    </div>
                    <input 
                      type="range" 
                      min="14" 
                      max="68" 
                      value={titleFontSize} 
                      onChange={e => setTitleFontSize(Number(e.target.value))}
                      className="w-full h-1.2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600" 
                    />
                  </div>

                  {/* Financial Cycle Year size */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="font-bold text-slate-600">Financial Year Size</span>
                      <span className="font-mono font-black">{finYearFontSize}px</span>
                    </div>
                    <input 
                      type="range" 
                      min="8" 
                      max="35" 
                      value={finYearFontSize} 
                      onChange={e => setFinYearFontSize(Number(e.target.value))}
                      className="w-full h-1.2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600" 
                    />
                  </div>

                  {/* Document Subtitle Size */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="font-bold text-slate-600">Document Subtitle Size</span>
                      <span className="font-mono font-black">{docTitleFontSize}px</span>
                    </div>
                    <input 
                      type="range" 
                      min="10" 
                      max="60" 
                      value={docTitleFontSize} 
                      onChange={e => setDocTitleFontSize(Number(e.target.value))}
                      className="w-full h-1.2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600" 
                    />
                  </div>

                  {/* Compiled Date Size */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="font-bold text-slate-600">Date Compiled Size</span>
                      <span className="font-mono font-black">{compiledDateFontSize}px</span>
                    </div>
                    <input 
                      type="range" 
                      min="8" 
                      max="36" 
                      value={compiledDateFontSize} 
                      onChange={e => setCompiledDateFontSize(Number(e.target.value))}
                      className="w-full h-1.2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600" 
                    />
                  </div>
                </div>

                {/* Front Scales & Logo Controls */}
                <div className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-black tracking-widest uppercase text-slate-500 font-mono">Front Layout Frame & Logo Scale</span>
                  
                  {/* Logo Scale slider */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="font-bold text-slate-700">Logo Scale (Size)</span>
                      <span className="font-mono font-black">{logoScale}%</span>
                    </div>
                    <input 
                      type="range" 
                      min="10" 
                      max="250" 
                      value={logoScale} 
                      onChange={e => setLogoScale(Number(e.target.value))}
                      className="w-full h-1.2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600" 
                    />
                  </div>

                  {/* Border Boundary thickness slider */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="font-bold text-slate-700">Design Boundary Frame Size</span>
                      <span className="font-mono font-black">{borderPixel}px</span>
                    </div>
                    <input 
                      type="range" 
                      min="0" 
                      max="60" 
                      value={borderPixel} 
                      onChange={e => setBorderPixel(Number(e.target.value))}
                      className="w-full h-1.2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600" 
                    />
                  </div>
                </div>

                {/* Front Element Font Colors */}
                <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-550 uppercase tracking-wider block font-mono flex items-center gap-1"><Palette className="w-3.5 h-3.5 text-indigo-505" /> Front Design Element Colors</span>
                  <div className="grid grid-cols-2 gap-2.5">
                    
                    {/* Muni Color */}
                    <div className="space-y-1 bg-white p-2 border rounded-lg">
                      <span className="text-[9px] font-black uppercase text-slate-500 block">Municipality</span>
                      <div className="flex items-center gap-1">
                        <input type="color" value={muniColor} onChange={e => setMuniColor(e.target.value)} className="w-6 h-6 rounded border-none cursor-pointer p-0" />
                        <span className="text-[10px] font-mono leading-none">{muniColor}</span>
                      </div>
                    </div>

                    {/* Title Color */}
                    <div className="space-y-1 bg-white p-2 border rounded-lg">
                      <span className="text-[9px] font-black uppercase text-slate-500 block">Doc Classification</span>
                      <div className="flex items-center gap-1">
                        <input type="color" value={titleColor} onChange={e => setTitleColor(e.target.value)} className="w-6 h-6 rounded border-none cursor-pointer p-0" />
                        <span className="text-[10px] font-mono leading-none">{titleColor}</span>
                      </div>
                    </div>

                    {/* Year Color */}
                    <div className="space-y-1 bg-white p-2 border rounded-lg">
                      <span className="text-[9px] font-black uppercase text-slate-500 block">Financial Cycle</span>
                      <div className="flex items-center gap-1">
                        <input type="color" value={finYearColor} onChange={e => setFinYearColor(e.target.value)} className="w-6 h-6 rounded border-none cursor-pointer p-0" />
                        <span className="text-[10px] font-mono leading-none">{finYearColor}</span>
                      </div>
                    </div>

                    {/* Text Color Selection */}
                    <div className="space-y-1 bg-white p-2 border rounded-lg">
                      <span className="text-[9px] font-black uppercase text-slate-500 block">Core Label Color</span>
                      <div className="flex items-center gap-1">
                        <input type="color" value={textColor} onChange={e => setTextColor(e.target.value)} className="w-6 h-6 rounded border-none cursor-pointer p-0" />
                        <span className="text-[10px] font-mono leading-none">{textColor}</span>
                      </div>
                    </div>

                    {/* Front Overlay Tint Color */}
                    <div className="space-y-1 bg-white p-2 border rounded-lg col-span-2">
                      <span className="text-[9px] font-black uppercase text-slate-505 block">Overlay Tint Shade (Blended)</span>
                      <div className="flex items-center gap-2">
                        <input type="color" value={tintColor} onChange={e => setTintColor(e.target.value)} className="w-7 h-7 rounded border-none cursor-pointer p-0 flex-shrink-0" />
                        <span className="text-xs font-mono font-extrabold">{tintColor}</span>
                      </div>
                    </div>

                  </div>
                </div>

                {/* Front Page Sign-off Officials */}
                <div className="space-y-3 bg-slate-50 p-4 rounded-xl border">
                  <span className="text-[10px] font-black uppercase text-slate-550 block font-mono">Front Page Sign-off Officials</span>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Accounting Officer (A4 Bottom)</label>
                    <input 
                      type="text" 
                      value={signOffMM} 
                      onChange={e => setSignOffMM(e.target.value)} 
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-slate-400" 
                    />
                  </div>
                </div>

              </div>
            ) : (
              /* ================== BACK COVER SPECIFIC STYLE TOOLS ================== */
              <div className="space-y-6 animate-fade-in">
                
                {/* Back Page Background Visibility & Opacity (Satisfies background can be seen target) */}
                <div className="space-y-4 bg-slate-50 p-4 rounded-2xl border border-indigo-100">
                  <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-widest block font-mono flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5 text-indigo-600 animate-pulse" /> Back Cover Visibilities
                  </span>
                  
                  {/* Slider to control background opacity so it is absolutely visible */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <label className="font-bold text-slate-700">Back Background Opacity</label>
                      <span className="font-mono font-bold text-indigo-700">{backBgOpacity}%</span>
                    </div>
                    <input 
                      type="range" 
                      min="0" 
                      max="100" 
                      value={backBgOpacity} 
                      onChange={e => setBackBgOpacity(Number(e.target.value))}
                      className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600" 
                    />
                  </div>

                  {/* Slider to control background blur */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <label className="font-bold text-slate-705">Back Background Soft blur</label>
                      <span className="font-mono font-bold text-indigo-700">{backBgBlur}px</span>
                    </div>
                    <input 
                      type="range" 
                      min="0" 
                      max="12" 
                      value={backBgBlur} 
                      onChange={e => setBackBgBlur(Number(e.target.value))}
                      className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600" 
                    />
                  </div>
                </div>

                {/* Back Page Pattern Brushes */}
                <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-600 block uppercase tracking-wider font-mono">Back Canvas Pattern Overlay</span>
                  <select 
                    value={backPattern} 
                    onChange={e => setBackPattern(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-800 cursor-pointer focus:border-slate-450"
                  >
                    <option value="none">No Pattern (Solid Blend)</option>
                    <option value="dots">Dots Texture Pattern</option>
                    <option value="grid">Compliance Grid Overlay</option>
                    <option value="stripes">Diagonal Elegant Stripes</option>
                    <option value="double-border">Dash Offset Borders Line</option>
                    <option value="luxury-frame">Double Line Luxury Inset Frame</option>
                  </select>
                </div>

                {/* Back Layout Dimensions & Scalers */}
                <div className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-black tracking-widest uppercase text-slate-500 font-mono">Back Cover Frame, Pattern & Logo Scalers</span>
                  
                  {/* Back Logo scale slider */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="font-bold text-slate-705">Back Logo Scale (Size)</span>
                      <span className="font-mono font-black">{backLogoScale}%</span>
                    </div>
                    <input 
                      type="range" 
                      min="10" 
                      max="250" 
                      value={backLogoScale} 
                      onChange={e => setBackLogoScale(Number(e.target.value))}
                      className="w-full h-1.2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-650" 
                    />
                  </div>

                  {/* Back Pattern scale slider */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="font-bold text-slate-705">Back Pattern Density / Frame Offset</span>
                      <span className="font-mono font-black">{backPatternScale}px</span>
                    </div>
                    <input 
                      type="range" 
                      min="8" 
                      max="100" 
                      value={backPatternScale} 
                      onChange={e => setBackPatternScale(Number(e.target.value))}
                      className="w-full h-1.2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-655" 
                    />
                  </div>
                </div>

                {/* Back Page Typography Customizer */}
                <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-650 block uppercase tracking-wider font-mono">Back Font Family Picker</span>
                  <select 
                    value={backFont} 
                    onChange={e => setBackFont(e.target.value)} 
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-medium text-slate-800 outline-none cursor-pointer focus:border-slate-400"
                  >
                    {['Space Grotesk', 'Inter', 'Playfair Display', 'JetBrains Mono', 'Cinzel', 'Montserrat', 'Outfit', 'Georgia'].map(font => (
                      <option key={font} value={font}>{font}</option>
                    ))}
                  </select>
                </div>

                {/* Back Text Sizes draggers */}
                <div className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-black tracking-widest uppercase text-slate-500 font-mono">Back Text Sizes (px)</span>
                  
                  {/* Title Size */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="font-bold text-slate-600">Report Title Size</span>
                      <span className="font-mono font-black">{backTitleFontSize}px</span>
                    </div>
                    <input 
                      type="range" min="14" max="55" value={backTitleFontSize} onChange={e => setBackTitleFontSize(Number(e.target.value))}
                      className="w-full h-1 bg-slate-200 rounded-lg cursor-pointer accent-indigo-600" 
                    />
                  </div>

                  {/* Year Size */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="font-bold text-slate-600">Financial Cycle Size</span>
                      <span className="font-mono font-black">{backFinYearFontSize}px</span>
                    </div>
                    <input 
                      type="range" min="8" max="28" value={backFinYearFontSize} onChange={e => setBackFinYearFontSize(Number(e.target.value))}
                      className="w-full h-1 bg-slate-200 rounded-lg cursor-pointer accent-indigo-600" 
                    />
                  </div>

                  {/* Prepared By Size */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="font-bold text-slate-600">Prepared By Label Size</span>
                      <span className="font-mono font-black">{backPreparedByFontSize}px</span>
                    </div>
                    <input 
                      type="range" min="8" max="24" value={backPreparedByFontSize} onChange={e => setBackPreparedByFontSize(Number(e.target.value))}
                      className="w-full h-1 bg-slate-200 rounded-lg cursor-pointer accent-indigo-600" 
                    />
                  </div>

                  {/* Office Label Size */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="font-bold text-slate-600">Office Name Stamp Size</span>
                      <span className="font-mono font-black">{backOfficeFontSize}px</span>
                    </div>
                    <input 
                      type="range" min="8" max="24" value={backOfficeFontSize} onChange={e => setBackOfficeFontSize(Number(e.target.value))}
                      className="w-full h-1 bg-slate-200 rounded-lg cursor-pointer accent-indigo-600" 
                    />
                  </div>

                  {/* Sign off Sign size */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="font-bold text-slate-600">Sign-off Officer Name Size</span>
                      <span className="font-mono font-black">{backSignOffFontSize}px</span>
                    </div>
                    <input 
                      type="range" min="10" max="36" value={backSignOffFontSize} onChange={e => setBackSignOffFontSize(Number(e.target.value))}
                      className="w-full h-1 bg-slate-200 rounded-lg cursor-pointer accent-indigo-600" 
                    />
                  </div>

                  {/* Muni Label bottom left */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="font-bold text-slate-600">Municipality Label Size</span>
                      <span className="font-mono font-black">{backMuniFontSize}px</span>
                    </div>
                    <input 
                      type="range" min="8" max="28" value={backMuniFontSize} onChange={e => setBackMuniFontSize(Number(e.target.value))}
                      className="w-full h-1 bg-slate-200 rounded-lg cursor-pointer accent-indigo-600" 
                    />
                  </div>
                </div>

                {/* Back Color Customizer Palette */}
                <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-600 block uppercase tracking-wider font-mono flex items-center gap-1"><Palette className="w-3.5 h-3.5 text-indigo-650" /> Back Design Element Colors</span>
                  <div className="grid grid-cols-2 gap-2">
                    
                    <div className="bg-white p-2 border rounded-lg">
                      <span className="text-[9px] font-bold text-slate-450 block uppercase">Title Text</span>
                      <input type="color" value={backTitleColor} onChange={e => setBackTitleColor(e.target.value)} className="w-[100%] h-6 cursor-pointer p-0 border-none" />
                    </div>

                    <div className="bg-white p-2 border rounded-lg">
                      <span className="text-[9px] font-bold text-slate-455 block uppercase">Year Label</span>
                      <input type="color" value={backFinYearColor} onChange={e => setBackFinYearColor(e.target.value)} className="w-[100%] h-6 cursor-pointer p-0 border-none" />
                    </div>

                    <div className="bg-white p-2 border rounded-lg">
                      <span className="text-[9px] font-bold text-slate-450 block uppercase">Prepared By</span>
                      <input type="color" value={backPreparedByColor} onChange={e => setBackPreparedByColor(e.target.value)} className="w-[100%] h-6 cursor-pointer p-0 border-none" />
                    </div>

                    <div className="bg-white p-2 border rounded-lg">
                      <span className="text-[9px] font-bold text-slate-450 block uppercase">Office Label</span>
                      <input type="color" value={backOfficeLabelColor} onChange={e => setBackOfficeLabelColor(e.target.value)} className="w-[100%] h-6 cursor-pointer p-0 border-none" />
                    </div>

                    <div className="bg-white p-2 border rounded-lg">
                      <span className="text-[9px] font-bold text-slate-450 block uppercase">Officer Name</span>
                      <input type="color" value={backSignOffColor} onChange={e => setBackSignOffColor(e.target.value)} className="w-[100%] h-6 cursor-pointer p-0 border-none" />
                    </div>

                    <div className="bg-white p-2 border rounded-lg">
                      <span className="text-[9px] font-bold text-slate-450 block uppercase">Muni Label</span>
                      <input type="color" value={backMuniColor} onChange={e => setBackMuniColor(e.target.value)} className="w-[100%] h-6 cursor-pointer p-0 border-none" />
                    </div>

                    <div className="bg-white p-2 border rounded-lg">
                      <span className="text-[9px] font-bold text-slate-450 block uppercase">Rights Note</span>
                      <input type="color" value={backRightsColor} onChange={e => setBackRightsColor(e.target.value)} className="w-[100%] h-6 cursor-pointer p-0 border-none" />
                    </div>

                    <div className="bg-white p-2 border rounded-lg">
                      <span className="text-[9px] font-bold text-slate-450 block uppercase">System Stamp</span>
                      <input type="color" value={backSystemGeneratedColor} onChange={e => setBackSystemGeneratedColor(e.target.value)} className="w-[100%] h-6 cursor-pointer p-0 border-none" />
                    </div>

                  </div>
                </div>

                {/* Back Cover editable labels */}
                <div className="space-y-4 bg-slate-50 p-4 rounded-xl border">
                  <span className="text-[10px] font-black uppercase text-indigo-700 block font-mono">Back Cover Page Details Setup</span>
                  
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Prepared By Description</label>
                    <input 
                      type="text" 
                      value={backPreparedBy} 
                      onChange={e => setBackPreparedBy(e.target.value)} 
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.8 text-xs font-semibold text-slate-800 outline-none" 
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="space-y-1">
                       <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Office Label</label>
                       <input type="text" value={backOfficeLabel} onChange={e => setBackOfficeLabel(e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.8 text-xs font-semibold text-slate-800 outline-none" />
                    </div>
                    <div className="space-y-1">
                       <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Sign-off Officer</label>
                       <input type="text" value={backSignOffPerson} onChange={e => setBackSignOffPerson(e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.8 text-xs font-semibold text-slate-800 outline-none" />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">All Rights Footer Notice</label>
                    <input 
                      type="text" 
                      value={backRights} 
                      onChange={e => setBackRights(e.target.value)} 
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.8 text-xs font-semibold text-slate-800 outline-none" 
                    />
                  </div>
                </div>

              </div>
            )}

          </div>

          {/* PERSISTENT SAVE BUTTON */}
          <div className="p-5 border-t border-slate-200 bg-white sticky bottom-0 z-30">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="w-full bg-slate-900 border border-slate-950 hover:bg-slate-850 disabled:bg-slate-200 disabled:text-slate-400 text-white font-extrabold py-3.5 rounded-xl text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition cursor-pointer shadow"
            >
              {isSaving ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Adopting Schema...</>
              ) : (
                <><Save className="w-4 h-4" /> Save Configuration</>
              )}
            </button>
          </div>

        </div>

        {/* COMPILER PREVIEW STAGE CONTAINER */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 flex justify-center bg-slate-100/50 relative hide-scrollbar print:bg-white print:p-0">
          
          <div className="w-full max-w-[650px] h-fit mt-1 md:mt-2 mb-16 print:max-w-none print:w-[100vw] print:h-[100vh] print:m-0">
            
            <div className="mb-4 flex flex-col gap-3 print:hidden">
               <div className="flex items-center justify-between w-full">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-widest font-mono flex items-center gap-2 select-none">
                     <Eye className="w-4 h-4 animate-bounce" /> Live Compiler Output Grid
                  </span>
                  <span className="text-[10px] bg-indigo-900 text-white px-2.5 py-1 rounded shadow-sm font-mono font-bold uppercase tracking-widest tracking-wider scale-95 select-none animate-pulse">A4 COMPLIANCE CANVAS</span>
               </div>
 
               {/* Target module push adopting workflow controllers! */}
               <div className="flex flex-col gap-3 p-4 bg-white border border-slate-250/60 rounded-2xl shadow-sm mt-1 select-none">
                 <div className="flex flex-col sm:flex-row gap-3 items-center justify-between border-b border-slate-100 pb-3">
                   <div className="flex flex-col text-left">
                     <p className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                       <ArrowRight className="w-3.5 h-3.5 text-indigo-600" /> Adoption Pipeline Engine
                     </p>
                     <p className="text-[10px] text-slate-500 max-w-sm mt-1 leading-tight font-medium">Adopt this fully designed cover directly to the relevant compliance report tab on Supabase.</p>
                   </div>
                   
                   <div className="flex flex-wrap gap-1">
                     {[
                       { key: 'ar', label: 'Adopt to AR' },
                       { key: 'apr', label: 'Adopt to APR' },
                       { key: 'idp', label: 'Adopt to IDP' },
                       { key: 'sdbip', label: 'Adopt to SDBIP' }
                     ].map(target => (
                       <button
                         key={target.key}
                         disabled={isPushing !== null || isPushingImage}
                         onClick={() => handlePushToModule(target.key as any, target.label)}
                         className="bg-indigo-50 border border-indigo-200 hover:border-slate-900 text-indigo-900 hover:bg-slate-900 hover:text-white font-extrabold text-[9px] px-2.5 py-1.5 rounded-lg transition-all cursor-pointer disabled:opacity-50 uppercase tracking-tight flex items-center gap-1 shrink-0"
                       >
                         {isPushing === target.key ? <Loader2 className="w-3 h-3 animate-spin text-indigo-500" /> : <Plus className="w-3 h-3 text-indigo-600" />}
                         <span>{target.label}</span>
                       </button>
                     ))}
                   </div>
                 </div>

                 {/* Push Designed Canvas Image directly to Annual Report (AR) Drafting Suite Cover gallery! */}
                 <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-indigo-50/40 p-3 rounded-xl border border-indigo-100">
                   <div className="text-left flex-1 col-span-2">
                     <p className="text-[11px] font-black text-indigo-950 uppercase tracking-wide flex items-center gap-1">
                       🎨 Push Designed Cover Canvas
                     </p>
                     <p className="text-[10px] text-slate-600 font-medium leading-normal mt-0.5">
                       Convert active <span className="font-bold text-indigo-900">{isFrontPage ? 'Front Cover' : 'Back Cover'}</span> visual styling into an image and push it to the Annual Report Cover gallery.
                     </p>
                   </div>
                   <button
                     type="button"
                     disabled={isPushingImage || isPushing !== null}
                     onClick={handlePushDesignAsImage}
                     className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-extrabold text-[10px] px-4 py-2.5 rounded-xl transition-all cursor-pointer shadow-sm tracking-wide shrink-0 flex items-center gap-1.5 uppercase hover:shadow"
                   >
                     {isPushingImage ? (
                       <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Rendering Canvas...</>
                     ) : (
                       <><Plus className="w-3.5 h-3.5" /> Push designed page to AR</>
                     )}
                   </button>
                 </div>
               </div>

               {pushStatus && (
                 <div className="text-[10px] font-mono font-bold text-center py-2 px-4 bg-indigo-950 border border-indigo-800 text-indigo-200 rounded-xl select-none animate-pulse">
                   SYSTEM ADOPTION PIPELINE STATUS: {pushStatus}
                 </div>
               )}
            </div>

            {/* DIRECT VISUAL A4 SHEETS CANVAS PREVIEWS */}
            {isFrontPage ? (
              /* FRONT PAGE GRAPHICS */
              <div 
                id="front-page-preview"
                style={{ fontFamily: `'${titleFont}', Inter, system-ui, sans-serif` }}
                className={cn(
                  "w-full aspect-[1/1.414] bg-white shadow-2xl relative overflow-hidden transition-all duration-500 border print:shadow-none print:aspect-auto print:h-screen print:w-screen print:border-none",
                  coverDesign === 'modern' ? "rounded-3xl print:rounded-none" : "rounded-sm print:rounded-none"
                )}
              >
                {renderConfidentialStamp()}

                {coverDesign === 'graphic-full-bleed' && (
                  <div 
                    className="absolute inset-0 z-0 bg-cover bg-center transition-all duration-300"
                    style={{ backgroundImage: `url(${currentBgImage})` }}
                  />
                )}
                
                {coverDesign === 'modern' && (
                  <>
                    <div className="absolute inset-0 bg-slate-900 z-0"></div>
                    <div 
                      className="absolute inset-0 z-0 bg-cover bg-center mix-blend-overlay scale-105 transition-all duration-300"
                      style={{ 
                        backgroundImage: `url(${currentBgImage})`,
                        opacity: (100 - overlayOpacity) / 100
                      }}
                    />
                    <div 
                      className="absolute inset-0 z-10 transition-all duration-300" 
                      style={{
                        background: `linear-gradient(to top, ${tintColor} 0%, rgba(15,23,42,0.95) ${Math.max(0, fadePosition - 20)}%, rgba(15,23,42,0.4) ${fadePosition}%, rgba(15,23,42,0) 100%)`
                      }}
                    />
                    
                    <div className="absolute top-12 left-12 right-12 z-20 flex justify-between items-start">
                       <div className="rounded-2xl bg-white/15 backdrop-blur-md border border-white/25 shadow-2xl flex items-center justify-center p-2.5 transition-all duration-300" style={{ width: `${80 * (logoScale / 100)}px`, height: `${80 * (logoScale / 100)}px` }}>
                         {selectedLogo && selectedLogo !== 'default' && (
                           <img src={selectedLogo} alt="Logo" className="w-full h-full object-contain drop-shadow-xl" referrerPolicy="no-referrer" />
                         )}
                       </div>
                       <div className="text-right">
                          <div style={{ fontSize: `${finYearFontSize}px`, color: finYearColor }} className="font-extrabold tracking-widest uppercase bg-black/35 px-4 py-1.5 rounded-full backdrop-blur-sm inline-block">
                            {financialYear}
                          </div>
                       </div>
                    </div>
  
                    <div className="absolute bottom-12 left-12 right-12 z-20 space-y-6">
                       <div className="space-y-2">
                          <h2 style={{ fontSize: `${muniFontSize}px`, color: muniColor }} className="font-black tracking-widest uppercase">{municipalityName}</h2>
                          <h1 style={{ fontSize: `${titleFontSize}px`, color: titleColor }} className="font-black leading-none uppercase tracking-tight drop-shadow-lg">
                            {documentType}
                          </h1>
                          {documentTitle && (
                            <p style={{ color: textColor, fontSize: `${docTitleFontSize}px` }} className="font-bold pt-1.5 leading-tight">{documentTitle}</p>
                          )}
                          <p style={{ color: textColor, fontSize: `${compiledDateFontSize}px` }} className="font-bold tracking-wider font-mono pt-1">
                            Compiled: {compiledDate}
                          </p>
                       </div>
                       
                       <div className="w-24 h-1.5 rounded-full" style={{ backgroundColor: primaryColor }} />
                    </div>
                  </>
                )}
  
                {coverDesign === 'classic' && (
                  <>
                    <div 
                      className="absolute top-0 left-0 right-0 bg-cover bg-center z-0 transition-all duration-300"
                      style={{ 
                        backgroundImage: `url(${currentBgImage})`,
                        height: `${fadePosition}%`
                      }}
                    />
                    <div 
                      className="absolute top-0 left-0 right-0 bg-gradient-to-b from-transparent to-white z-0 transition-all duration-300" 
                      style={{
                        height: `${fadePosition}%`,
                        backgroundColor: `rgba(255,255,255, ${overlayOpacity / 200})`
                      }}
                    />
                    
                    <div className="absolute top-0 left-0 w-full h-3 z-20" style={{ backgroundColor: primaryColor }}></div>
                    <div className="absolute bottom-0 left-0 w-full h-4 z-20" style={{ backgroundColor: secondaryColor }}></div>
                    
                    <div className="absolute inset-x-10 bottom-14 z-20 flex flex-col items-center text-center space-y-6 bg-white/95 backdrop-blur p-8 rounded-2xl shadow-xl border border-slate-100">
                      
                      <div className="flex items-center justify-center transition-all duration-300" style={{ width: `${96 * (logoScale / 100)}px`, height: `${96 * (logoScale / 100)}px` }}>
                        {selectedLogo && selectedLogo !== 'default' && (
                          <img src={selectedLogo} alt="Logo" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                        )}
                      </div>
  
                      <div className="space-y-3">
                        <h2 style={{ fontSize: `${muniFontSize}px`, color: muniColor }} className="font-bold tracking-[0.2em] uppercase border-b border-slate-200 pb-3">{municipalityName}</h2>
                        <h1 style={{ fontSize: `${titleFontSize}px`, color: titleColor }} className="font-black leading-tight uppercase tracking-tight pt-1">
                          {documentType}
                        </h1>
                        <h3 className="text-slate-600 font-bold" style={{ fontSize: `${docTitleFontSize}px` }}>{documentTitle}</h3>
                      </div>
  
                      <div className="flex flex-col gap-1 items-center">
                        <div style={{ fontSize: `${finYearFontSize}px`, color: finYearColor }} className="inline-block px-5 py-1.5 rounded-full font-bold tracking-widest uppercase bg-slate-50">
                          {financialYear}
                        </div>
                        <p style={{ color: textColor, fontSize: `${compiledDateFontSize}px` }} className="font-bold font-mono tracking-wider">
                          Date Compiled: {compiledDate}
                        </p>
                      </div>
  
                    </div>
                  </>
                )}
  
                {coverDesign === 'minimalist' && (
                   <>
                    <div className="absolute inset-0 bg-white z-0 border-slate-100" style={{ borderWidth: `${borderPixel}px` }}></div>
                    
                    <div 
                      className="absolute bg-cover bg-center z-10 rounded-2xl overflow-hidden shadow-2xl transition-all duration-300" 
                      style={{ 
                        backgroundImage: `url(${currentBgImage})`,
                        left: `${borderPixel + 16}px`,
                        top: `${borderPixel + 16}px`,
                        bottom: `${borderPixel + 16}px`,
                        width: `calc(${fadePosition}% - ${borderPixel}px - 2rem)`
                      }}
                    >
                      <div 
                        className="absolute inset-0 mix-blend-multiply transition-all duration-300"
                        style={{ backgroundColor: `rgba(0,0,0, ${overlayOpacity / 120})` }}
                      />
                    </div>
  
                    <div 
                      className="absolute ml-12 z-20 flex flex-col justify-center space-y-10 pl-12 pr-4 transition-all duration-300"
                      style={{ 
                        left: `${fadePosition}%`,
                        right: `${borderPixel + 16}px`,
                        top: `${borderPixel + 16}px`,
                        bottom: `${borderPixel + 16}px`
                      }}
                    >
                       <div className="border border-slate-200 p-2 rounded-xl shadow-sm bg-white transition-all duration-300" style={{ width: `${64 * (logoScale / 100)}px`, height: `${64 * (logoScale / 100)}px` }}>
                         {selectedLogo && selectedLogo !== 'default' && (
                           <img src={selectedLogo} alt="Logo" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                         )}
                       </div>
  
                       <div className="space-y-4">
                         <div style={{ fontSize: `${muniFontSize}px`, color: muniColor }} className="font-bold tracking-widest uppercase">{municipalityName}</div>
                         <h1 style={{ fontSize: `${titleFontSize}px`, color: titleColor }} className="font-black leading-[1.1] uppercase tracking-tight">
                           {documentType.split(' ').map((word, i) => <span key={i} className="block">{word}</span>)}
                         </h1>
                         {documentTitle && (
                           <h3 className="text-slate-500 font-medium max-w-sm mt-4" style={{ fontSize: `${docTitleFontSize}px` }}>{documentTitle}</h3>
                         )}
                       </div>
  
                       <div className="pt-6 mt-auto border-t border-slate-105 flex items-center justify-between">
                         <div style={{ fontSize: `${finYearFontSize}px`, color: finYearColor }} className="font-mono font-bold">{financialYear}</div>
                         <div className="w-6 h-6 rounded-full" style={{ backgroundColor: secondaryColor }} />
                       </div>
                    </div>
                   </>
                )}
  
                {coverDesign === 'corporate' && (
                  <>
                    <div className="absolute inset-0 bg-white z-0"></div>
                    <div className="absolute left-0 top-0 bottom-0 w-32 z-10" style={{ backgroundColor: primaryColor }}></div>
                    <div 
                      className="absolute left-32 top-16 right-16 bg-cover bg-center z-10 transition-all duration-300" 
                      style={{ 
                        backgroundImage: `url(${currentBgImage})`,
                        height: `${35 + fadePosition * 0.4}%`
                      }}
                    >
                       <div 
                         className="absolute inset-0 mix-blend-multiply transition-all duration-300"
                         style={{ backgroundColor: `rgba(15,23,42, ${overlayOpacity / 120})` }}
                       />
                    </div>
                    <div className="absolute left-24 top-16 bg-white shadow-xl z-20 flex items-center justify-center p-2 transition-all duration-300" style={{ width: `${56 * (logoScale / 100)}px`, height: `${56 * (logoScale / 100)}px` }}>
                         {selectedLogo && selectedLogo !== 'default' && (
                           <img src={selectedLogo} alt="Logo" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                         )}
                    </div>
                    
                    <div 
                      className="absolute left-40 right-16 bottom-16 z-20 flex flex-col justify-between pt-8 transition-all duration-300"
                      style={{ top: `calc(${35 + fadePosition * 0.4}% + 5.5rem)` }}
                    >
                       <div className="space-y-4">
                         <div className="w-12 h-1 mb-6" style={{ backgroundColor: secondaryColor }}></div>
                         <h2 style={{ fontSize: `${muniFontSize}px`, color: muniColor }} className="font-bold tracking-widest uppercase">{municipalityName}</h2>
                         <h1 style={{ fontSize: `${titleFontSize}px`, color: titleColor }} className="font-black leading-[1.05] uppercase tracking-tighter">
                           {documentType}
                         </h1>
                         {documentTitle && (
                           <h3 className="text-slate-600 font-medium mt-3 border-l-4 pl-4" style={{ borderColor: primaryColor, fontSize: `${docTitleFontSize}px` }}>{documentTitle}</h3>
                         )}
                       </div>
                       
                       <div className="flex items-center justify-between border-t border-slate-200 mt-8 pt-6">
                         <span style={{ fontSize: `${finYearFontSize}px`, color: finYearColor }} className="bg-slate-100 px-3 py-1.5 font-bold tracking-widest uppercase">{financialYear}</span>
                       </div>
                    </div>
                  </>
                )}
  
                {coverDesign === 'editorial' && (
                  <>
                    <div className="absolute inset-0 z-0 transition-all duration-300" style={{ backgroundColor: '#FAF9F6', borderColor: primaryColor, borderWidth: `${borderPixel}px` }}></div>
                    <div 
                      className="absolute inset-0 bg-cover bg-center z-10 grayscale transition-all duration-300" 
                      style={{ 
                        backgroundImage: `url(${currentBgImage})`,
                        margin: `${borderPixel}px`,
                        opacity: overlayOpacity / 150
                      }}
                    />
                    
                    <div 
                      className="absolute z-20 flex flex-col items-center justify-between text-center transition-all duration-300 left-12 right-12"
                      style={{ top: `${borderPixel + 24}px`, bottom: `${borderPixel + 24}px` }}
                    >
                       <div className="space-y-5 flex flex-col items-center w-full">
                         <div className="mb-2 transition-all duration-300" style={{ width: `${80 * (logoScale / 100)}px`, height: `${80 * (logoScale / 100)}px` }}>
                           {selectedLogo && selectedLogo !== 'default' && (
                             <img src={selectedLogo} alt="Logo" className="w-full h-full object-contain mix-blend-multiply" referrerPolicy="no-referrer" />
                           )}
                         </div>
                         <h2 style={{ fontSize: `${muniFontSize}px`, color: muniColor }} className="font-serif font-medium tracking-[0.2em] uppercase">{municipalityName}</h2>
                         <div className="w-full h-px bg-slate-300 my-4"></div>
                         <h1 style={{ fontSize: `${titleFontSize}px`, color: titleColor }} className="font-serif leading-none tracking-tight">
                           {documentType}
                         </h1>
                         {documentTitle && (
                           <h3 className="text-slate-600 font-serif italic mt-4 max-w-lg" style={{ fontSize: `${docTitleFontSize}px` }}>{documentTitle}</h3>
                         )}
                       </div>
                       
                       <div className="w-full flex flex-col items-center pb-6">
                         <div style={{ fontSize: `${finYearFontSize}px`, color: finYearColor }} className="font-serif tracking-[0.3em] uppercase mb-4">{financialYear}</div>
                         <div className="w-16 h-px" style={{ backgroundColor: secondaryColor }}></div>
                       </div>
                    </div>
                  </>
                )}
  
                {coverDesign === 'bold' && (
                  <>
                    <div className="absolute inset-0 z-0 bg-slate-900"></div>
                    <div 
                      className="absolute right-0 top-0 bottom-0 bg-cover bg-center z-10 transition-all duration-300" 
                      style={{ 
                        backgroundImage: `url(${currentBgImage})`,
                        width: `${fadePosition}%`
                      }}
                    >
                       <div 
                         className="absolute inset-0 transition-opacity duration-300" 
                         style={{
                           background: `linear-gradient(to right, rgba(15,23,42,1) 0%, rgba(15,23,42, ${overlayOpacity / 100}) 100%)`
                         }}
                       />
                    </div>
                    
                    <div className="absolute left-12 top-12 z-20">
                      <div className="bg-white shadow-2xl flex items-center justify-center p-2 rounded-br-2xl transition-all duration-300" style={{ width: `${64 * (logoScale / 100)}px`, height: `${64 * (logoScale / 100)}px` }}>
                         {selectedLogo && selectedLogo !== 'default' && (
                           <img src={selectedLogo} alt="Logo" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                         )}
                      </div>
                    </div>
  
                    <div className="absolute left-13 bottom-12 right-12 z-20 flex flex-col justify-end">
                       <h2 style={{ fontSize: `${muniFontSize}px`, color: muniColor }} className="font-bold tracking-[0.2em] uppercase mb-4 flex items-center gap-3">
                         <span className="w-8 h-1" style={{ backgroundColor: secondaryColor }}></span>
                         {municipalityName}
                       </h2>
                       <h1 style={{ fontSize: `${titleFontSize}px`, color: titleColor }} className="font-black leading-[0.9] uppercase tracking-tighter opacity-90 mb-4">
                         {documentType}
                       </h1>
                       {documentTitle && (
                         <div className="bg-white/10 backdrop-blur-sm border-l-4 p-4 inline-block" style={{ borderColor: primaryColor }}>
                           <h3 className="text-white font-medium tracking-wide leading-tight" style={{ fontSize: `${docTitleFontSize}px` }}>{documentTitle}</h3>
                         </div>
                       )}
                       
                       <div className="flex items-center justify-between mt-8 text-white/50 font-mono text-xs">
                         <span style={{ fontSize: `${finYearFontSize}px`, color: finYearColor }} className="font-extrabold uppercase">{financialYear}</span>
                       </div>
                    </div>
                  </>
                )}
  
                {coverDesign === 'split-duo' && (
                  <>
                    <div 
                      className="absolute right-0 top-0 bottom-0 z-10 flex flex-col items-center justify-center p-12 text-center text-white transition-all duration-300" 
                      style={{ 
                        backgroundColor: primaryColor,
                        width: `${100 - fadePosition}%`
                      }}
                    >
                        <div className="bg-white/10 rounded-full p-3 mb-8 backdrop-blur shadow-2xl border border-white/20 transition-all duration-300" style={{ width: `${80 * (logoScale / 100)}px`, height: `${80 * (logoScale / 100)}px` }}>
                          {selectedLogo && selectedLogo !== 'default' && (
                            <img src={selectedLogo} alt="Logo" className="w-full h-full object-contain drop-shadow-lg" referrerPolicy="no-referrer" />
                          )}
                        </div>
                        <h2 style={{ fontSize: `${finYearFontSize}px`, color: finYearColor }} className="font-mono tracking-widest uppercase mb-4 bg-black/20 px-3 py-1.5 rounded-full border border-white/10">
                          {financialYear}
                        </h2>
                    </div>
                    <div 
                      className="absolute left-0 top-0 bottom-0 bg-white z-10 flex flex-col justify-between p-12 bg-cover bg-center transition-all duration-300" 
                      style={{ 
                        backgroundImage: `url(${currentBgImage})`,
                        width: `${fadePosition}%`
                      }}
                    >
                        <div 
                          className="absolute inset-0 transition-all duration-300" 
                          style={{
                            backgroundColor: `rgba(255,255,255, ${overlayOpacity / 100})`,
                            backdropFilter: `blur(${Math.max(0, Math.min(20, (100 - overlayOpacity) / 5))}px)`
                          }}
                        />
                        <div className="relative z-20 top-0 left-0">
                           <h4 style={{ fontSize: `${muniFontSize}px`, color: muniColor }} className="font-bold tracking-[0.15em] uppercase mb-4 flex items-center gap-2">
                              <span className="w-6 h-0.5 rounded-full" style={{ backgroundColor: secondaryColor }}></span>
                              {municipalityName}
                           </h4>
                        </div>
                        <div className="relative z-20 pb-[10%]">
                           <h1 style={{ fontSize: `${titleFontSize}px`, color: titleColor }} className="font-black leading-tight uppercase tracking-tighter mb-4 relative">
                             {documentType}
                           </h1>
                           {documentTitle && (
                             <h3 className="text-slate-650 font-semibold leading-relaxed" style={{ fontSize: `${docTitleFontSize}px` }}>
                                {documentTitle}
                             </h3>
                           )}
                        </div>
                        <div className="relative z-20 pb-2">
                           <div className="w-24 h-1 rounded-full bg-slate-300"></div>
                        </div>
                    </div>
                  </>
                )}
  
                {coverDesign === 'cosmic' && (
                  <>
                    <div className="absolute inset-0 bg-slate-950 z-0"></div>
                    <div 
                      className="absolute inset-0 bg-cover bg-center z-0 mix-blend-screen mix-blend-luminosity grayscale transition-opacity duration-300" 
                      style={{ 
                        backgroundImage: `url(${currentBgImage})`,
                        opacity: overlayOpacity / 350
                      }}
                    />
                    <div 
                      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] z-10"
                      style={{
                        background: `radial-gradient(ellipse at center, rgba(30,58,138,0.45) 0%, rgba(15,23,42,0.85) ${fadePosition}%, rgba(2,6,23,1) 100%)`
                      }}
                    />
                    
                    <div className="absolute inset-10 border border-white/10 rounded-3xl z-20 flex flex-col justify-between p-12 backdrop-blur-[2px]">
                       <div className="flex justify-between items-start w-full">
                          <div className="bg-white/5 rounded-2xl p-2.5 border border-white/10 backdrop-blur shadow-2xl transition-all duration-300" style={{ width: `${56 * (logoScale / 100)}px`, height: `${56 * (logoScale / 100)}px` }}>
                             {selectedLogo && selectedLogo !== 'default' && (
                               <img src={selectedLogo} alt="Logo" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                             )}
                          </div>
                       </div>
  
                       <div className="text-center flex-1 flex flex-col justify-center items-center">
                          <span style={{ fontSize: `${muniFontSize}px`, color: muniColor }} className="font-mono uppercase tracking-[0.3em] font-medium mb-6 border-b border-white/10 pb-3 inline-block">
                             {municipalityName}
                          </span>
                          <h1 style={{ fontSize: `${titleFontSize}px`, color: titleColor }} className="text-transparent bg-clip-text bg-gradient-to-b from-white to-white/65 font-black leading-[1.1] uppercase tracking-tighter mb-6">
                            {documentType}
                          </h1>
                          {documentTitle && (
                            <h3 className="text-slate-300 font-light tracking-wide max-w-sm mx-auto leading-relaxed" style={{ fontSize: `${docTitleFontSize}px` }}>
                              {documentTitle}
                            </h3>
                          )}
                       </div>
  
                       <div className="flex justify-center w-full">
                          <span style={{ fontSize: `${finYearFontSize}px`, color: finYearColor }} className="font-mono text-sm tracking-[0.2em]">{financialYear}</span>
                       </div>
                    </div>
                  </>
                )}
  
              </div>
            ) : (
              /* BACK PAGE GRAPHICS */
              <div 
                id="back-page-preview"
                style={{ fontFamily: `'${backFont}', Inter, system-ui, sans-serif` }}
                className={cn(
                  "w-full aspect-[1/1.414] bg-white shadow-2xl relative overflow-hidden transition-all duration-500 border p-12 flex flex-col print:shadow-none print:aspect-auto print:h-screen print:w-screen print:border-none",
                  coverDesign === 'modern' ? "rounded-3xl print:rounded-none" : "rounded-sm print:rounded-none"
                )}
              >
                 {/* Back Background cover image rendering with custom opacities */}
                 <div 
                   className="absolute inset-0 bg-cover bg-center transition-all duration-300 z-0 animate-fade-in" 
                   style={{ 
                     backgroundImage: `url(${currentBackBgImageValue})`,
                     opacity: backBgOpacity / 100,
                     filter: backBgBlur > 0 ? `blur(${backBgBlur}px)` : 'none'
                   }}
                 />

                 {/* Back Pattern Overlays */}
                 {backPattern !== 'none' && backPattern !== 'luxury-frame' && (
                   <div 
                     className="absolute inset-0 pointer-events-none z-10 transition-all duration-350" 
                     style={renderPatternCSS(backPattern, backPatternScale)}
                   />
                 )}
                 {backPattern === 'luxury-frame' && (
                   <div 
                     style={renderPatternCSS('luxury-frame', backPatternScale)}
                   />
                 )}
                 
                 {coverDesign === 'modern' && (
                    <div className="absolute top-0 left-0 w-full h-4 z-20" style={{ backgroundColor: primaryColor }}></div>
                 )}
                 {coverDesign === 'classic' && (
                    <div className="absolute bottom-0 left-0 w-full h-8 z-20" style={{ backgroundColor: secondaryColor }}></div>
                 )}
                 {coverDesign === 'minimalist' && (
                    <div className="absolute right-0 top-0 bottom-0 w-4 z-20" style={{ backgroundColor: primaryColor }}></div>
                 )}
                 {coverDesign === 'corporate' && (
                    <div className="absolute left-0 top-0 bottom-0 w-16 z-20" style={{ backgroundColor: primaryColor }}></div>
                 )}
                 {coverDesign === 'editorial' && (
                    <>
                      <div className="absolute inset-0 z-20 pointer-events-none" style={{ borderColor: primaryColor, borderWidth: `${borderPixel}px` }}></div>
                    </>
                 )}
                 {coverDesign === 'bold' && (
                    <div className="absolute top-0 left-0 right-0 h-16 z-20" style={{ backgroundColor: primaryColor }}></div>
                 )}
                 {coverDesign === 'split-duo' && (
                    <div className="absolute left-0 top-0 bottom-0 w-8 z-20" style={{ backgroundColor: primaryColor }}></div>
                 )}
                 {coverDesign === 'cosmic' && (
                    <div className="absolute inset-0 bg-slate-950 z-0 pointer-events-none" style={{ opacity: Math.max(0.1, (100 - backBgOpacity) / 100) }}></div>
                 )}

                 <div className="z-10 flex-grow flex flex-col justify-end">
                    
                    <div className="mb-auto pb-10 border-b border-slate-200">
                       <div className="grayscale opacity-85 mb-6 transition-all duration-300" style={{ width: `${64 * (backLogoScale / 100)}px`, height: `${64 * (backLogoScale / 100)}px` }}>
                         {selectedLogo && selectedLogo !== 'default' && (
                           <img src={selectedLogo} alt="Logo" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                         )}
                       </div>
                       <h3 style={{ color: backTitleColor, fontSize: `${backTitleFontSize}px` }} className="font-black tracking-tight uppercase mb-2 leading-tight">
                         {documentType}
                       </h3>
                       <p style={{ color: backFinYearColor, fontSize: `${backFinYearFontSize}px` }} className="font-bold uppercase tracking-widest">
                         {financialYear}
                       </p>
                    </div>

                    <div className="space-y-2 mb-12 flex flex-col gap-4">
                       <p style={{ color: backPreparedByColor, fontSize: `${backPreparedByFontSize}px` }} className="font-bold tracking-wide">
                         {backPreparedBy}
                       </p>
                       <div className="bg-white/80 backdrop-blur-sm p-5 border border-slate-200 rounded-xl shadow-sm inline-block self-start">
                          <p style={{ color: backOfficeLabelColor, fontSize: `${backOfficeFontSize}px` }} className="font-bold uppercase tracking-wider mb-2">{backOfficeLabel}</p>
                          <p style={{ color: backSignOffColor, fontSize: `${backSignOffFontSize}px` }} className="font-black uppercase leading-none">{backSignOffPerson}</p>
                       </div>
                    </div>

                    <div className="pt-8 flex justify-between items-end border-t border-slate-220 text-xs font-bold uppercase tracking-widest">
                       <div>
                         <p style={{ color: backMuniColor, fontSize: `${backMuniFontSize}px` }} className="font-bold mb-1">{municipalityName}</p>
                         <p style={{ color: backRightsColor, fontSize: `${backRightsFontSize}px` }} className="font-medium tracking-wide">{backRights}</p>
                       </div>
                       <div className="text-right">
                         <p style={{ color: backSystemGeneratedColor, fontSize: `${backSystemGeneratedFontSize}px` }} className="font-bold tracking-wide">{backSystemGenerated}</p>
                       </div>
                    </div>
                 </div>

              </div>
            )}
          </div>

        </div>

      </div>

      {/* PERFECT HIGH-FIDELITY AUTOMATED A4 EXPORT PORTAL */}
      <div
        id="offscreen-export-portal"
        style={{
          position: 'fixed',
          left: '-9999px',
          top: '-9999px',
          width: '794px',
          height: '1123px',
          overflow: 'hidden',
          pointerEvents: 'none',
          zIndex: -1000
        }}
        className="bg-white"
      >
        {/* Authoritative A4 Front Cover Capture Zone */}
        <div 
          id="front-page-capture"
          style={{ 
            fontFamily: `'${titleFont}', Inter, system-ui, sans-serif`,
            width: '794px',
            height: '1123px',
            boxSizing: 'border-box'
          }}
          className={cn(
            "relative overflow-hidden bg-white"
          )}
        >
          {renderConfidentialStamp()}

          {coverDesign === 'graphic-full-bleed' && (
            <div 
              className="absolute inset-0 z-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${currentBgImage})` }}
            />
          )}
          
          {coverDesign === 'modern' && (
            <>
              <div className="absolute inset-0 bg-slate-900 z-0"></div>
              <div 
                className="absolute inset-0 z-0 bg-cover bg-center mix-blend-overlay scale-105"
                style={{ 
                  backgroundImage: `url(${currentBgImage})`,
                  opacity: (100 - overlayOpacity) / 100
                }}
              />
              <div 
                className="absolute inset-0 z-10" 
                style={{
                  background: `linear-gradient(to top, ${tintColor} 0%, rgba(15,23,42,0.95) ${Math.max(0, fadePosition - 20)}%, rgba(15,23,42,0.4) ${fadePosition}%, rgba(15,23,42,0) 100%)`
                }}
              />
              
              <div className="absolute top-12 left-12 right-12 z-20 flex justify-between items-start">
                 <div className="rounded-2xl bg-white/15 backdrop-blur-md border border-white/25 shadow-2xl flex items-center justify-center p-2.5" style={{ width: `${80 * (logoScale / 100)}px`, height: `${80 * (logoScale / 100)}px` }}>
                   {selectedLogo && selectedLogo !== 'default' && (
                     <img src={selectedLogo} alt="Logo" className="w-full h-full object-contain drop-shadow-xl" referrerPolicy="no-referrer" />
                   )}
                 </div>
                 <div className="text-right">
                    <div style={{ fontSize: `${finYearFontSize}px`, color: finYearColor }} className="font-extrabold tracking-widest uppercase bg-black/35 px-4 py-1.5 rounded-full backdrop-blur-sm inline-block">
                      {financialYear}
                    </div>
                 </div>
              </div>

              <div className="absolute bottom-12 left-12 right-12 z-20 space-y-6">
                 <div className="space-y-2">
                    <h2 style={{ fontSize: `${muniFontSize}px`, color: muniColor }} className="font-black tracking-widest uppercase">{municipalityName}</h2>
                    <h1 style={{ fontSize: `${titleFontSize}px`, color: titleColor }} className="font-black leading-none uppercase tracking-tight drop-shadow-lg">
                      {documentType}
                    </h1>
                    {documentTitle && (
                      <p style={{ color: textColor, fontSize: `${docTitleFontSize}px` }} className="font-bold pt-1.5 leading-tight">{documentTitle}</p>
                    )}
                    <p style={{ color: textColor, fontSize: `${compiledDateFontSize}px` }} className="font-bold tracking-wider font-mono pt-1">
                      Compiled: {compiledDate}
                    </p>
                 </div>
                 
                 <div className="w-24 h-1.5 rounded-full" style={{ backgroundColor: primaryColor }} />
              </div>
            </>
          )}

          {coverDesign === 'classic' && (
            <>
              <div 
                className="absolute top-0 left-0 right-0 bg-cover bg-center z-0"
                style={{ 
                  backgroundImage: `url(${currentBgImage})`,
                  height: `${fadePosition}%`
                }}
              />
              <div 
                className="absolute top-0 left-0 right-0 bg-gradient-to-b from-transparent to-white z-0" 
                style={{
                  height: `${fadePosition}%`,
                  backgroundColor: `rgba(255,255,255, ${overlayOpacity / 200})`
                }}
              />
              
              <div className="absolute inset-12 z-10 flex flex-col justify-between" style={{ color: textColor }}>
                <div className="flex justify-between items-start">
                  <div className="grayscale opacity-90" style={{ width: `${76 * (logoScale / 100)}px`, height: `${76 * (logoScale / 100)}px` }}>
                    {selectedLogo && selectedLogo !== 'default' && (
                      <img src={selectedLogo} alt="Logo" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                    )}
                  </div>
                  <div style={{ fontSize: `${finYearFontSize}px`, color: finYearColor }} className="font-mono text-sm tracking-widest font-black uppercase border-b-2 border-slate-900 pb-1">
                    {financialYear}
                  </div>
                </div>

                <div className="space-y-4">
                  <h2 style={{ fontSize: `${muniFontSize}px`, color: muniColor }} className="font-serif italic text-lg tracking-wider font-semibold">{municipalityName}</h2>
                  <h1 style={{ fontSize: `${titleFontSize}px`, color: titleColor }} className="font-extrabold leading-none uppercase tracking-tight font-serif pb-2 border-b border-slate-350">
                    {documentType}
                  </h1>
                  {documentTitle && (
                    <p style={{ color: textColor, fontSize: `${docTitleFontSize}px` }} className="font-medium max-w-lg leading-relaxed text-slate-705">{documentTitle}</p>
                  )}
                  <p style={{ color: textColor, fontSize: `${compiledDateFontSize}px` }} className="text-xs uppercase tracking-widest font-bold font-mono">
                    Published: {compiledDate}
                  </p>
                </div>

                <div className="h-2 w-full" style={{ backgroundColor: secondaryColor }} />
              </div>
            </>
          )}

          {coverDesign === 'minimalist' && (
            <div className="absolute inset-16 z-10 flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <div className="grayscale opacity-75" style={{ width: `${52 * (logoScale / 100)}px`, height: `${52 * (logoScale / 100)}px` }}>
                  {selectedLogo && selectedLogo !== 'default' && (
                    <img src={selectedLogo} alt="Logo" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                  )}
                </div>
                <div style={{ fontSize: `${finYearFontSize}px`, color: finYearColor }} className="font-mono text-xs tracking-widest font-medium text-slate-400">
                  {financialYear}
                </div>
              </div>

              <div className="space-y-4 max-w-md">
                <h2 style={{ fontSize: `${muniFontSize}px`, color: muniColor }} className="text-xs font-bold uppercase tracking-[0.25em] text-slate-400">{municipalityName}</h2>
                <h1 style={{ fontSize: `${titleFontSize}px`, color: titleColor }} className="font-black leading-tight uppercase tracking-tighter text-slate-900">
                  {documentType}
                </h1>
                {documentTitle && (
                  <p style={{ color: textColor, fontSize: `${docTitleFontSize}px` }} className="text-xs font-medium text-slate-500 tracking-wide leading-relaxed">{documentTitle}</p>
                )}
                <div className="pt-2">
                  <p style={{ color: textColor, fontSize: `${compiledDateFontSize}px` }} className="text-[10px] uppercase font-mono tracking-widest text-slate-450">
                    DATE: {compiledDate}
                  </p>
                </div>
              </div>

              <div className="h-0.5 w-12 bg-slate-900" />
            </div>
          )}

          {coverDesign === 'corporate' && (
            <>
              <div 
                className="absolute right-0 top-0 bottom-0 w-2/5 bg-cover bg-center z-0"
                style={{ backgroundImage: `url(${currentBgImage})` }}
              />
              <div 
                className="absolute right-0 top-0 bottom-0 w-2/5 z-0"
                style={{ backgroundColor: tintColor, opacity: overlayOpacity / 200 }}
              />
              <div className="absolute inset-16 z-15 flex flex-col justify-between">
                <div className="max-w-[50%] space-y-6">
                  <div className="grayscale opacity-95 mb-6" style={{ width: `${76 * (logoScale / 100)}px`, height: `${76 * (logoScale / 100)}px` }}>
                    {selectedLogo && selectedLogo !== 'default' && (
                      <img src={selectedLogo} alt="Logo" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                    )}
                  </div>
                  <h2 style={{ fontSize: `${muniFontSize}px`, color: muniColor }} className="text-xs font-black uppercase tracking-widest text-slate-500 font-mono">{municipalityName}</h2>
                  <h1 style={{ fontSize: `${titleFontSize}px`, color: titleColor }} className="font-black leading-none uppercase tracking-tight text-slate-900">
                    {documentType}
                  </h1>
                  {documentTitle && (
                    <p style={{ color: textColor, fontSize: `${docTitleFontSize}px` }} className="text-sm font-semibold text-slate-600 leading-snug">{documentTitle}</p>
                  )}
                </div>

                <div className="flex items-end justify-between">
                  <div style={{ color: textColor, fontSize: `${compiledDateFontSize}px` }} className="text-xs font-mono font-bold text-slate-400 font-mono">
                    Compiled: {compiledDate}
                  </div>
                  <div style={{ fontSize: `${finYearFontSize}px`, color: finYearColor }} className="font-bold tracking-wider text-slate-800 bg-slate-100 px-4 py-2 rounded-xl border border-slate-200">
                    {financialYear}
                  </div>
                </div>
              </div>
            </>
          )}

          {coverDesign === 'editorial' && (
            <>
              <div 
                className="absolute inset-10 z-0 bg-cover bg-center"
                style={{ 
                  backgroundImage: `url(${currentBgImage})`,
                  opacity: overlayOpacity / 250
                }}
              />
              <div className="absolute inset-10 border z-10 flex flex-col justify-between p-12" style={{ borderColor: primaryColor, borderWidth: `${borderPixel}px` }}>
                <div className="flex justify-between items-start">
                  <div className="grayscale opacity-90 p-2 bg-white" style={{ width: `${80 * (logoScale / 100)}px`, height: `${80 * (logoScale / 100)}px` }}>
                    {selectedLogo && selectedLogo !== 'default' && (
                      <img src={selectedLogo} alt="Logo" className="w-full h-full object-contain mix-blend-multiply" referrerPolicy="no-referrer" />
                    )}
                  </div>
                  <div style={{ fontSize: `${finYearFontSize}px`, color: finYearColor }} className="font-serif italic font-bold text-slate-900 border-b border-slate-900 pb-1">
                    {financialYear}
                  </div>
                </div>

                <div className="p-8 bg-white/95 backdrop-blur-md max-w-sm border border-slate-200 rounded-xl space-y-4">
                  <h2 style={{ fontSize: `${muniFontSize}px`, color: muniColor }} className="text-xs font-extrabold uppercase tracking-widest text-slate-500 font-mono">{municipalityName}</h2>
                  <h1 style={{ fontSize: `${titleFontSize}px`, color: titleColor }} className="font-serif font-black leading-tight uppercase tracking-tight text-slate-900">
                    {documentType}
                  </h1>
                  {documentTitle && (
                    <p style={{ color: textColor, fontSize: `${docTitleFontSize}px` }} className="text-xs font-medium text-slate-600 leading-relaxed italic">{documentTitle}</p>
                  )}
                  <p style={{ color: textColor, fontSize: `${compiledDateFontSize}px` }} className="text-[10px] tracking-widest font-mono text-slate-400 font-bold">
                    PRINTED: {compiledDate}
                  </p>
                </div>

                <div className="w-12 h-1 bg-slate-900" />
              </div>
            </>
          )}

          {coverDesign === 'bold' && (
            <>
              <div className="absolute top-0 left-0 right-0 h-2/5 z-0" style={{ backgroundColor: secondaryColor }}></div>
              <div 
                className="absolute top-0 left-0 right-0 h-2/5 z-0 bg-cover bg-center mix-blend-multiply opacity-55"
                style={{ backgroundImage: `url(${currentBgImage})` }}
              />
              <div className="absolute inset-14 z-10 flex flex-col justify-between text-slate-900">
                <div className="flex justify-between items-start text-white">
                  <div className="p-2 bg-white rounded-xl shadow-lg" style={{ width: `${80 * (logoScale / 100)}px`, height: `${80 * (logoScale / 100)}px` }}>
                    {selectedLogo && selectedLogo !== 'default' && (
                      <img src={selectedLogo} alt="Logo" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                    )}
                  </div>
                  <div style={{ fontSize: `${finYearFontSize}px`, color: finYearColor }} className="font-mono text-base tracking-[0.2em] font-extrabold drop-shadow-md">
                    {financialYear}
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="space-y-3">
                    <h2 style={{ fontSize: `${muniFontSize}px`, color: muniColor }} className="text-xs font-extrabold uppercase tracking-[0.3em] text-slate-505">{municipalityName}</h2>
                    <h1 style={{ fontSize: `${titleFontSize}px`, color: titleColor }} className="font-black leading-none uppercase tracking-tighter text-slate-900 text-6xl break-words">
                      {documentType}
                    </h1>
                    {documentTitle && (
                      <p style={{ color: textColor, fontSize: `${docTitleFontSize}px`, borderColor: primaryColor }} className="font-bold border-l-4 pl-4 leading-normal text-slate-705">{documentTitle}</p>
                    )}
                  </div>

                  <div className="flex justify-between items-end border-t border-slate-200 pt-6">
                    <p style={{ color: textColor, fontSize: `${compiledDateFontSize}px` }} className="text-xs font-bold font-mono text-slate-400 font-mono">
                      DOCUMENT COMPILATION: {compiledDate}
                    </p>
                    <div className="w-16 h-4" style={{ backgroundColor: primaryColor }} />
                  </div>
                </div>
              </div>
            </>
          )}

          {coverDesign === 'split-duo' && (
            <>
              <div 
                className="absolute inset-y-0 left-0 w-1/2 bg-cover bg-center z-0"
                style={{ backgroundImage: `url(${currentBgImage})` }}
              />
              <div 
                className="absolute inset-y-0 left-0 w-1/2 z-0"
                style={{ backgroundColor: tintColor, opacity: overlayOpacity / 180 }}
              />
              <div className="absolute inset-y-0 right-0 w-1/2 bg-slate-50 z-0"></div>
              
              <div className="absolute inset-16 z-10 flex flex-col justify-between">
                <div className="flex justify-between items-start">
                  <div className="p-3 bg-white/90 backdrop-blur border rounded-2xl shadow-xl" style={{ width: `${64 * (logoScale / 100)}px`, height: `${64 * (logoScale / 100)}px` }}>
                     {selectedLogo && selectedLogo !== 'default' && (
                       <img src={selectedLogo} alt="Logo" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                     )}
                  </div>
                  <div style={{ fontSize: `${finYearFontSize}px`, color: finYearColor }} className="font-mono text-xs uppercase tracking-[0.3em] text-slate-400">
                    {financialYear}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-12 items-end">
                  <div></div>
                  <div className="space-y-5 text-right">
                    <h2 style={{ fontSize: `${muniFontSize}px`, color: muniColor }} className="text-[10px] font-black tracking-widest uppercase text-slate-455">{municipalityName}</h2>
                    <h1 style={{ fontSize: `${titleFontSize}px`, color: titleColor }} className="font-black leading-none uppercase tracking-tight text-slate-900 font-mono">
                      {documentType}
                    </h1>
                    {documentTitle && (
                      <p style={{ color: textColor, fontSize: `${docTitleFontSize}px` }} className="text-xs font-semibold text-slate-505 leading-relaxed">{documentTitle}</p>
                    )}
                    <div className="pt-2">
                      <p style={{ color: textColor, fontSize: `${compiledDateFontSize}px` }} className="text-[9px] uppercase font-mono tracking-widest text-slate-450">
                        DATE REVISION: {compiledDate}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {coverDesign === 'cosmic' && (
            <>
              <div className="absolute inset-0 bg-slate-950 z-0"></div>
              <div 
                className="absolute inset-0 bg-cover bg-center z-0 mix-blend-screen mix-blend-luminosity grayscale" 
                style={{ 
                  backgroundImage: `url(${currentBgImage})`,
                  opacity: overlayOpacity / 350
                }}
              />
              <div 
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] z-10"
                style={{
                  background: `radial-gradient(ellipse at center, rgba(30,58,138,0.45) 0%, rgba(15,23,42,0.85) ${fadePosition}%, rgba(2,6,23,1) 100%)`
                }}
              />
              
              <div className="absolute inset-10 border border-white/10 rounded-3xl z-20 flex flex-col justify-between p-12 backdrop-blur-[2px]">
                 <div className="flex justify-between items-start w-full">
                    <div className="bg-white/5 rounded-2xl p-2.5 border border-white/10 backdrop-blur shadow-2xl" style={{ width: `${56 * (logoScale / 100)}px`, height: `${56 * (logoScale / 100)}px` }}>
                       {selectedLogo && selectedLogo !== 'default' && (
                         <img src={selectedLogo} alt="Logo" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                       )}
                    </div>
                 </div>

                 <div className="text-center flex-1 flex flex-col justify-center items-center">
                    <span style={{ fontSize: `${muniFontSize}px`, color: muniColor }} className="font-mono uppercase tracking-[0.3em] font-medium mb-6 border-b border-white/10 pb-3 inline-block">
                       {municipalityName}
                    </span>
                    <h1 style={{ fontSize: `${titleFontSize}px`, color: titleColor }} className="text-transparent bg-clip-text bg-gradient-to-b from-white to-white/65 font-black leading-[1.1] uppercase tracking-tighter mb-6">
                      {documentType}
                    </h1>
                    {documentTitle && (
                      <h3 className="text-slate-300 font-light tracking-wide max-w-sm mx-auto leading-relaxed" style={{ fontSize: `${docTitleFontSize}px` }}>
                        {documentTitle}
                      </h3>
                    )}
                 </div>

                 <div className="flex justify-center w-full">
                    <span style={{ fontSize: `${finYearFontSize}px`, color: finYearColor }} className="font-mono text-sm tracking-[0.2em]">{financialYear}</span>
                 </div>
              </div>
            </>
          )}

        </div>

        {/* Authoritative A4 Back Cover Capture Zone */}
        <div 
          id="back-page-capture"
          style={{ 
            fontFamily: `'${backFont}', Inter, system-ui, sans-serif`,
            width: '794px',
            height: '1123px',
            boxSizing: 'border-box'
          }}
          className={cn(
            "relative overflow-hidden bg-white p-12 flex flex-col"
          )}
        >
           {/* Back Background cover image rendering with custom opacities */}
           <div 
             className="absolute inset-0 bg-cover bg-center z-0" 
             style={{ 
               backgroundImage: `url(${currentBackBgImageValue})`,
               opacity: backBgOpacity / 100,
               filter: backBgBlur > 0 ? `blur(${backBgBlur}px)` : 'none'
             }}
           />

           {/* Back Pattern Overlays */}
           {backPattern !== 'none' && backPattern !== 'luxury-frame' && (
             <div 
               className="absolute inset-0 pointer-events-none z-10" 
               style={renderPatternCSS(backPattern, backPatternScale)}
             />
           )}
           {backPattern === 'luxury-frame' && (
             <div 
               style={renderPatternCSS('luxury-frame', backPatternScale)}
             />
           )}
           
           {coverDesign === 'modern' && (
              <div className="absolute top-0 left-0 w-full h-4 z-20" style={{ backgroundColor: primaryColor }}></div>
           )}
           {coverDesign === 'classic' && (
              <div className="absolute bottom-0 left-0 w-full h-8 z-20" style={{ backgroundColor: secondaryColor }}></div>
           )}
           {coverDesign === 'minimalist' && (
              <div className="absolute right-0 top-0 bottom-0 w-4 z-20" style={{ backgroundColor: primaryColor }}></div>
           )}
           {coverDesign === 'corporate' && (
              <div className="absolute left-0 top-0 bottom-0 w-16 z-20" style={{ backgroundColor: primaryColor }}></div>
           )}
           {coverDesign === 'editorial' && (
              <>
                <div className="absolute inset-0 z-20 pointer-events-none" style={{ borderColor: primaryColor, borderWidth: `${borderPixel}px` }}></div>
              </>
           )}
           {coverDesign === 'bold' && (
              <div className="absolute top-0 left-0 right-0 h-16 z-20" style={{ backgroundColor: primaryColor }}></div>
           )}
           {coverDesign === 'split-duo' && (
              <div className="absolute left-0 top-0 bottom-0 w-8 z-20" style={{ backgroundColor: primaryColor }}></div>
           )}
           {coverDesign === 'cosmic' && (
              <div className="absolute inset-0 bg-slate-950 z-0 pointer-events-none" style={{ opacity: Math.max(0.1, (100 - backBgOpacity) / 100) }}></div>
           )}

           <div className="z-10 flex-grow flex flex-col justify-end">
              
              <div className="mb-auto pb-10 border-b border-slate-200">
                 <div className="grayscale opacity-85 mb-6" style={{ width: `${64 * (backLogoScale / 100)}px`, height: `${64 * (backLogoScale / 100)}px` }}>
                   {selectedLogo && selectedLogo !== 'default' && (
                     <img src={selectedLogo} alt="Logo" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                   )}
                 </div>
                 <h3 style={{ color: backTitleColor, fontSize: `${backTitleFontSize}px` }} className="font-black tracking-tight uppercase mb-2 leading-tight">
                   {documentType}
                 </h3>
                 <p style={{ color: backFinYearColor, fontSize: `${backFinYearFontSize}px` }} className="font-bold uppercase tracking-widest">
                   {financialYear}
                 </p>
              </div>

              <div className="space-y-2 mb-12 flex flex-col gap-4">
                 <p style={{ color: backPreparedByColor, fontSize: `${backPreparedByFontSize}px` }} className="font-bold tracking-wide">
                   {backPreparedBy}
                 </p>
                 <div className="bg-white/80 backdrop-blur-sm p-5 border border-slate-200 rounded-xl shadow-sm inline-block self-start">
                    <p style={{ color: backOfficeLabelColor, fontSize: `${backOfficeFontSize}px` }} className="font-bold uppercase tracking-wider mb-2">{backOfficeLabel}</p>
                    <p style={{ color: backSignOffColor, fontSize: `${backSignOffFontSize}px` }} className="font-black uppercase leading-none">{backSignOffPerson}</p>
                 </div>
              </div>

              <div className="pt-8 flex justify-between items-end border-t border-slate-220 text-xs font-bold uppercase tracking-widest">
                 <div>
                   <p style={{ color: backMuniColor, fontSize: `${backMuniFontSize}px` }} className="font-bold mb-1">{municipalityName}</p>
                   <p style={{ color: backRightsColor, fontSize: `${backRightsFontSize}px` }} className="font-medium tracking-wide">{backRights}</p>
                 </div>
                 <div className="text-right">
                   <p style={{ color: backSystemGeneratedColor, fontSize: `${backSystemGeneratedFontSize}px` }} className="font-bold tracking-wide">{backSystemGenerated}</p>

</div>
</div>
</div>
</div>
</div>
</div>
  );
}
