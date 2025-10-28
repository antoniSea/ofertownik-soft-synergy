const express = require('express');
const jsPDF = require('jspdf');
const fs = require('fs').promises;
const path = require('path');
const handlebars = require('handlebars');
const Project = require('../models/Project');
const Portfolio = require('../models/Portfolio');
const Activity = require('../models/Activity');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Simple i18n dictionary for offer template
const i18n = {
  pl: {
    companyTagline: 'Innowacyjne rozwiązania programistyczne',
    offerTitle: 'Oferta Projektowa',
    date: 'Data',
    number: 'Numer',
    forLabel: 'Dla:',
    preliminaryTitle: '📋 Oferta Wstępna / Konsultacja',
    preliminaryLead: 'Niniejsza oferta ma charakter wstępny i konsultacyjny. Po dokładnym poznaniu Państwa potrzeb i wymagań przygotujemy szczegółową ofertę finalną z precyzyjną wyceną.',
    greeting: 'Szanowni Państwo,',
    guardianTitle: 'Państwa Dedykowany Opiekun Projektu',
    solutionScope: 'Proponowane Rozwiązanie i Zakres Prac',
    timeline: 'Harmonogram Projektu',
    investment: 'Inwestycja i Warunki Współpracy',
    tableStage: 'Etap / Usługa',
    tableCost: 'Koszt (PLN netto)',
    totalNet: 'RAZEM (netto)',
    paymentTerms: 'Warunki Płatności',
    warrantySupport: 'Gwarancja i Wsparcie',
    warrantySupportContent: 'Zapewniamy dodatkową 3‑miesięczną gwarancję na wdrożone rozwiązanie. Pozostałe prawa i obowiązki stron wynikają z przepisów prawa polskiego.',
    portfolioTitle: 'Nasze Doświadczenie w Praktyce',
    seeMorePortfolio: 'Zobacz więcej portfolio',
    nextSteps: 'Kolejne Kroki',
    prelimNextStepsLead: 'Dziękujemy za zainteresowanie naszymi usługami. Oto jak możemy kontynuować współpracę:',
    prelimStep1: 'Potwierdzenie zainteresowania i zgoda na dalsze konsultacje.',
    prelimStep2: 'Szczegółowa analiza wymagań i przygotowanie oferty finalnej.',
    prelimStep3: 'Prezentacja finalnej oferty z precyzyjną wyceną.',
    finalNextStepsLead: 'Jesteśmy podekscytowani perspektywą współpracy. Oto jak możemy rozpocząć:',
    finalStep1: 'Akceptacja oferty poprzez e-mail zwrotny.',
    finalStep2: 'Podpisanie umowy ramowej o współpracy.',
    finalStep3: 'Zaplanowanie warsztatu "kick-off" z Państwa opiekunem projektu.',
    prelimCta: 'Kontynuuję konsultacje',
    finalCta: 'Akceptuję i rozpoczynam współpracę',
    downloadOffer: 'Pobierz ofertę',
    reservations: 'Zastrzeżenia',
    res1: 'Oferta obejmuje wyłącznie prace wymienione w powyższym zakresie.',
    res2: 'Dodatkowe modyfikacje lub zmiany w trakcie realizacji mogą wymagać osobnej wyceny.',
    res3: 'Soft Synergy rozpoczyna realizację w terminie do 3 dni roboczych od potwierdzenia akceptacji oferty.'
  },
  en: {
    companyTagline: 'Innovative Software Solutions',
    offerTitle: 'Project Offer',
    date: 'Date',
    number: 'Number',
    forLabel: 'For:',
    preliminaryTitle: '📋 Preliminary Offer / Consultation',
    preliminaryLead: 'This offer is preliminary and consultative. After understanding your needs, we will prepare a detailed final offer with precise pricing.',
    greeting: 'Dear Sir/Madam,',
    guardianTitle: 'Your Dedicated Project Manager',
    solutionScope: 'Proposed Solution and Scope of Work',
    timeline: 'Project Timeline',
    investment: 'Investment and Terms of Cooperation',
    tableStage: 'Stage / Service',
    tableCost: 'Cost (PLN net)',
    totalNet: 'TOTAL (net)',
    paymentTerms: 'Payment Terms',
    warrantySupport: 'Warranty and Support',
    warrantySupportContent: 'We provide an additional 3‑month warranty for the implemented solution. All remaining rights and obligations are governed by Polish law.',
    portfolioTitle: 'Our Experience in Practice',
    seeMorePortfolio: 'See more portfolio',
    nextSteps: 'Next Steps',
    prelimNextStepsLead: 'Thank you for your interest. Here is how we can proceed:',
    prelimStep1: 'Confirm interest and agree to further consultations.',
    prelimStep2: 'Detailed requirements analysis and preparation of the final offer.',
    prelimStep3: 'Presentation of the final offer with precise pricing.',
    finalNextStepsLead: 'We are excited about the prospect of working together. Here is how we can start:',
    finalStep1: 'Accept the offer via reply email.',
    finalStep2: 'Sign a framework cooperation agreement.',
    finalStep3: 'Schedule a kick-off workshop with your project manager.',
    prelimCta: 'Proceed with consultation',
    finalCta: 'I accept and want to start',
    downloadOffer: 'Download offer',
    reservations: 'Reservations',
    res1: 'The offer includes only the work listed above.',
    res2: 'Additional modifications or changes during implementation may require a separate quote.',
    res3: 'Soft Synergy starts implementation within 3 business days after confirming acceptance of the offer.'
  }
};

// Helper function to format date
handlebars.registerHelper('formatDate', function(date) {
  return new Date(date).toLocaleDateString('pl-PL');
});

// Helper function to format currency
handlebars.registerHelper('formatCurrency', function(amount) {
  return new Intl.NumberFormat('pl-PL', {
    style: 'currency',
    currency: 'PLN'
  }).format(amount);
});

// Helper function to add numbers
handlebars.registerHelper('add', function(a, b) {
  return a + b;
});

// Helper function to check equality
handlebars.registerHelper('eq', function(a, b) {
  return a === b;
});

// Generate offer HTML
router.post('/generate/:projectId', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId)
      .populate('createdBy', 'firstName lastName email');
    
    if (!project) {
      return res.status(404).json({ message: 'Projekt nie został znaleziony' });
    }

    // Get portfolio items for the offer
    const portfolio = await Portfolio.find({ isActive: true })
      .sort({ order: 1 })
      .limit(2);

    // Read the HTML template
    const templatePath = path.join(__dirname, '../templates/offer-template.html');
    const templateContent = await fs.readFile(templatePath, 'utf8');

    // Compile template with Handlebars
    const template = handlebars.compile(templateContent);
    
    // Configure Handlebars to allow prototype properties
    handlebars.allowProtoPropertiesByDefault = true;
    
    // Create template with runtime options
    const templateWithOptions = handlebars.compile(templateContent, {
      allowProtoPropertiesByDefault: true
    });

    // Prepare data for template with language and translations
    const requestedLang = (req.query?.lang || '').toLowerCase();
    const lang = (requestedLang === 'en' || requestedLang === 'pl') ? requestedLang : ((project.language === 'en') ? 'en' : 'pl');
    const t = i18n[lang] || i18n.pl;
    const templateData = {
      lang,
      t,
      // Project details
      projectName: project.name,
      clientName: project.clientName,
      clientContact: project.clientContact,
      clientEmail: project.clientEmail,
      clientPhone: project.clientPhone,
      description: project.description,
      mainBenefit: project.mainBenefit,
      // Offer details
      offerDate: new Date().toLocaleDateString('pl-PL'),
      offerNumber: project.offerNumber || `SS/${new Date().getFullYear()}/${(new Date().getMonth()+1).toString().padStart(2, '0')}/${project._id.toString().slice(-4)}`,
      offerType: project.offerType || 'final',
      priceRange: project.priceRange,
      // Project manager - zawsze Jakub Czajka
      projectManager: {
        name: "Jakub Czajka",
        position: "Senior Project Manager",
        email: "jakub.czajka@soft-synergy.com",
        phone: "+48 793 868 886",
        avatar: "/generated-offers/jakub czajka.jpeg",
        description: "Nazywam się Jakub Czajka i pełnię rolę menedżera projektów w Soft Synergy. Specjalizuję się w koordynowaniu zespołów oraz zarządzaniu realizacją nowoczesnych projektów IT. Dbam o sprawną komunikację, terminowość oraz najwyższą jakość dostarczanych rozwiązań. Moim celem jest zapewnienie klientom profesjonalnej obsługi i skutecznej realizacji ich celów biznesowych."
      },
      // Modules
      modules: project.modules && project.modules.length > 0 ? 
        project.modules.map(module => ({
          name: module.name,
          description: module.description,
          color: module.color || 'blue'
        })) : 
        [{ name: 'Moduł przykładowy', description: 'Opis przykładowego modułu', color: 'blue' }],
      // Timeline
      timeline: project.timeline,
      // Pricing
      pricing: project.pricing,
      // Portfolio items
      portfolio: portfolio.map(item => ({
        _id: item._id.toString(),
        title: item.title,
        description: item.description,
        image: item.image,
        category: item.category,
        technologies: item.technologies,
        client: item.client,
        duration: item.duration,
        results: item.results,
        isActive: item.isActive,
        order: item.order
      })),
      // Custom reservations
      customReservations: project.customReservations || [],
      // Custom payment terms
      customPaymentTerms: project.customPaymentTerms || '10% zaliczki po podpisaniu umowy.\n90% po odbiorze końcowym projektu.',
      // Company details
      companyEmail: 'jakub.czajka@soft-synergy.com',
      companyPhone: '+48 793 868 886',
      companyNIP: '123-456-78-90'
    };

    // Generate HTML
    const html = templateWithOptions(templateData);

    // Create generated-offers directory if it doesn't exist
    const outputDir = path.join(__dirname, '../generated-offers');
    await fs.mkdir(outputDir, { recursive: true });

    // Clean up old offer files for this project
    try {
      const existingFiles = await fs.readdir(outputDir);
      const projectFiles = existingFiles.filter(file => file.startsWith(`offer-${project._id}-`));
      
      // Delete old files for this project
      for (const oldFile of projectFiles) {
        const oldFilePath = path.join(outputDir, oldFile);
        await fs.unlink(oldFilePath);
        console.log(`Deleted old offer file: ${oldFile}`);
      }
    } catch (cleanupError) {
      console.error('Error cleaning up old offer files:', cleanupError);
      // Continue with generation even if cleanup fails
    }

    // Save HTML file
    const fileName = `offer-${project._id}-${Date.now()}.html`;
    const filePath = path.join(outputDir, fileName);
    await fs.writeFile(filePath, html);

    // Try to generate PDF, but don't fail if it doesn't work
    let pdfFileName = null;
    let pdfUrl = null;
    
    try {
      const { jsPDF } = require('jspdf');
      const doc = new jsPDF();
      
      // Convert HTML to text for simple PDF generation
      const textContent = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
      
      // Split text into lines that fit the page
      const splitText = doc.splitTextToSize(textContent, 180);
      
      doc.setFontSize(12);
      doc.text(splitText, 15, 20);
      
      const pdfBuffer = doc.output('arraybuffer');

      // Clean up old PDF files for this project
      try {
        const existingFiles = await fs.readdir(outputDir);
        const projectPdfFiles = existingFiles.filter(file => file.startsWith(`offer-${project._id}-`) && file.endsWith('.pdf'));
        
        // Delete old PDF files for this project
        for (const oldPdfFile of projectPdfFiles) {
          const oldPdfFilePath = path.join(outputDir, oldPdfFile);
          await fs.unlink(oldPdfFilePath);
          console.log(`Deleted old PDF file: ${oldPdfFile}`);
        }
      } catch (pdfCleanupError) {
        console.error('Error cleaning up old PDF files:', pdfCleanupError);
        // Continue with PDF generation even if cleanup fails
      }

      // Save PDF file
      pdfFileName = `offer-${project._id}-${Date.now()}.pdf`;
      const pdfPath = path.join(outputDir, pdfFileName);
      await fs.writeFile(pdfPath, pdfBuffer);
      pdfUrl = `/generated-offers/${pdfFileName}`;
      
      console.log('PDF generated successfully');
    } catch (pdfError) {
      console.error('PDF generation failed:', pdfError);
      console.log('Continuing with HTML generation only');
    }

    // Update project with generated offer URL and PDF URL
    project.generatedOfferUrl = `/generated-offers/${fileName}`;
    if (pdfUrl) {
      project.pdfUrl = pdfUrl;
    }
    await project.save();

    // Log activity
    try {
      await Activity.create({
        action: 'offer.generated',
        entityType: 'project',
        entityId: project._id,
        author: req.user._id,
        message: `Offer generated for project "${project.name}"`,
        metadata: { htmlUrl: `/generated-offers/${fileName}`, pdfUrl }
      });
    } catch (e) {
      // ignore logging errors
    }

    // Add cache-busting headers
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });

    res.json({
      message: pdfUrl ? 'Oferta została wygenerowana pomyślnie' : 'Oferta HTML została wygenerowana pomyślnie (PDF nie udało się wygenerować)',
      htmlUrl: `/generated-offers/${fileName}`,
      professionalUrl: `/oferta-finalna/${project.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`,
      pdfUrl: pdfUrl,
      project: project
    });

  } catch (error) {
    console.error('Generate offer error:', error);
    res.status(500).json({ message: 'Błąd serwera podczas generowania oferty' });
  }
});

// Get offer preview (HTML)
router.get('/preview/:projectId', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId)
      .populate('createdBy', 'firstName lastName email');
    
    if (!project) {
      return res.status(404).json({ message: 'Projekt nie został znaleziony' });
    }

    // Get portfolio items
    const portfolio = await Portfolio.find({ isActive: true })
      .sort({ order: 1 })
      .limit(2);

    // Read template
    const templatePath = path.join(__dirname, '../templates/offer-template.html');
    const templateContent = await fs.readFile(templatePath, 'utf8');
    const template = handlebars.compile(templateContent);

    // Prepare data with language and translations
    const requestedLang = (req.query?.lang || '').toLowerCase();
    const lang = (requestedLang === 'en' || requestedLang === 'pl') ? requestedLang : ((project.language === 'en') ? 'en' : 'pl');
    const t = i18n[lang] || i18n.pl;
    const templateData = {
      lang,
      t,
      projectName: project.name,
      clientName: project.clientName,
      clientContact: project.clientContact,
      clientEmail: project.clientEmail,
      clientPhone: project.clientPhone,
      description: project.description,
      mainBenefit: project.mainBenefit,
      offerDate: new Date().toLocaleDateString('pl-PL'),
      offerNumber: project.offerNumber || 'SS/2024/05/01',
      offerType: project.offerType || 'final',
      priceRange: project.priceRange,
      projectManager: project.projectManager,
      modules: project.modules,
      timeline: project.timeline,
      pricing: project.pricing,
      portfolio: portfolio,
      customReservations: project.customReservations || [],
      customPaymentTerms: project.customPaymentTerms || '10% zaliczki po podpisaniu umowy.\n90% po odbiorze końcowym projektu.',
      companyEmail: 'jakub.czajka@soft-synergy.com',
      companyPhone: '+48 793 868 886',
      companyNIP: '123-456-78-90'
    };

    const html = template(templateData);

    res.setHeader('Content-Type', 'text/html');
    res.send(html);

  } catch (error) {
    console.error('Preview offer error:', error);
    res.status(500).json({ message: 'Błąd serwera podczas generowania podglądu' });
  }
});



// Generate professional offer URL
router.get('/professional-url/:projectId', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);
    
    if (!project) {
      return res.status(404).json({ message: 'Projekt nie został znaleziony' });
    }
    
    // Generate slug from project name
    const slug = project.name.toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
    
    const professionalUrl = `http://oferty.soft-synergy.com/oferta-finalna/${slug}`;
    
    res.json({
      professionalUrl,
      slug,
      projectName: project.name,
      message: 'Profesjonalny link został wygenerowany'
    });
    
  } catch (error) {
    console.error('Generate professional URL error:', error);
    res.status(500).json({ message: 'Błąd serwera podczas generowania profesjonalnego linku' });
  }
});

// Generate PDF only endpoint
router.post('/generate-pdf/:projectId', auth, async (req, res) => {
  try {
    // Try to get project from database first, if fails use data from request body
    let project;
    try {
      project = await Project.findById(req.params.projectId)
        .populate('createdBy', 'firstName lastName email');
    } catch (dbError) {
      console.log('Database not available, using request body data');
      // Use data from request body if database is not available
      project = req.body;
    }
    
    if (!project) {
      return res.status(404).json({ message: 'Projekt nie został znaleziony' });
    }

    // Get portfolio items for the offer
    const portfolio = await Portfolio.find({ isActive: true })
      .sort({ order: 1 })
      .limit(2);

    // Read the HTML template
    const templatePath = path.join(__dirname, '../templates/offer-template.html');
    const templateContent = await fs.readFile(templatePath, 'utf8');

    // Compile template with Handlebars
    const template = handlebars.compile(templateContent);
    
    // Prepare data for template with language and translations
    const requestedLang = (req.query?.lang || '').toLowerCase();
    const lang = (requestedLang === 'en' || requestedLang === 'pl') ? requestedLang : ((project.language === 'en') ? 'en' : 'pl');
    const t = i18n[lang] || i18n.pl;
    const templateData = {
      lang,
      t,
      // Project details
      projectName: project.name,
      clientName: project.clientName,
      clientContact: project.clientContact,
      clientEmail: project.clientEmail,
      clientPhone: project.clientPhone,
      description: project.description,
      mainBenefit: project.mainBenefit,
      // Offer details
      offerDate: new Date().toLocaleDateString('pl-PL'),
      offerNumber: project.offerNumber || `SS/${new Date().getFullYear()}/${(new Date().getMonth()+1).toString().padStart(2, '0')}/${project._id.toString().slice(-4)}`,
      offerType: project.offerType || 'final',
      priceRange: project.priceRange,
      // Project manager - zawsze Jakub Czajka
      projectManager: {
        name: "Jakub Czajka",
        position: "Senior Project Manager",
        email: "jakub.czajka@soft-synergy.com",
        phone: "+48 793 868 886",
        avatar: "/generated-offers/jakub czajka.jpeg",
        description: "Nazywam się Jakub Czajka i pełnię rolę menedżera projektów w Soft Synergy. Specjalizuję się w koordynowaniu zespołów oraz zarządzaniu realizacją nowoczesnych projektów IT. Dbam o sprawną komunikację, terminowość oraz najwyższą jakość dostarczanych rozwiązań. Moim celem jest zapewnienie klientom profesjonalnej obsługi i skutecznej realizacji ich celów biznesowych."
      },
      // Modules
      modules: project.modules && project.modules.length > 0 ? 
        project.modules.map(module => ({
          name: module.name,
          description: module.description,
          color: module.color || 'blue'
        })) : 
        [{ name: 'Moduł przykładowy', description: 'Opis przykładowego modułu', color: 'blue' }],
      // Timeline
      timeline: project.timeline,
      // Pricing
      pricing: project.pricing,
      // Portfolio items
      portfolio: portfolio.map(item => ({
        _id: item._id.toString(),
        title: item.title,
        description: item.description,
        image: item.image,
        category: item.category,
        technologies: item.technologies,
        client: item.client,
        duration: item.duration,
        results: item.results,
        isActive: item.isActive,
        order: item.order
      })),
      // Custom reservations
      customReservations: project.customReservations || [],
      // Custom payment terms
      customPaymentTerms: project.customPaymentTerms || '10% zaliczki po podpisaniu umowy.\n90% po odbiorze końcowym projektu.',
      // Company details
      companyEmail: 'jakub.czajka@soft-synergy.com',
      companyPhone: '+48 793 868 886',
      companyNIP: '123-456-78-90'
    };

    // Generate HTML
    const html = template(templateData);

    // Create generated-offers directory if it doesn't exist
    const outputDir = path.join(__dirname, '../generated-offers');
    await fs.mkdir(outputDir, { recursive: true });

    // Clean up old PDF files for this project
    try {
      const existingFiles = await fs.readdir(outputDir);
      const projectPdfFiles = existingFiles.filter(file => file.startsWith(`offer-${project._id}-`) && file.endsWith('.pdf'));
      
      // Delete old PDF files for this project
      for (const oldPdfFile of projectPdfFiles) {
        const oldPdfFilePath = path.join(outputDir, oldPdfFile);
        await fs.unlink(oldPdfFilePath);
        console.log(`Deleted old PDF file: ${oldPdfFile}`);
      }
    } catch (pdfCleanupError) {
      console.error('Error cleaning up old PDF files:', pdfCleanupError);
    }

    // Generate PDF using pdfkit
    const PDFDocument = require('pdfkit');
    const pdfFileName = `offer-${project._id}-${Date.now()}.pdf`;
    const pdfPath = path.join(outputDir, pdfFileName);

    await new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ 
          size: 'A4', 
          margins: { top: 50, left: 50, right: 50, bottom: 50 } 
        });
        const stream = require('fs').createWriteStream(pdfPath);
        doc.pipe(stream);

        // Helper function to clean text and handle line breaks
        const cleanText = (text) => {
          if (!text) return '';
          return text.toString()
            .replace(/[\u201C\u201D]/g, '"') // Replace smart quotes
            .replace(/[\u2018\u2019]/g, "'") // Replace smart apostrophes
            .replace(/[\u2013\u2014]/g, "-") // Replace em/en dashes
            .replace(/[\u2026]/g, "...") // Replace ellipsis
            .replace(/\s+/g, ' ') // Normalize whitespace
            .trim();
        };

        // Helper function to add text with proper line breaks
        const addText = (text, fontSize = 12, options = {}) => {
          const cleanedText = cleanText(text);
          const lines = doc.splitTextToSize(cleanedText, doc.page.width - doc.page.margins.left - doc.page.margins.right - 20);
          doc.fontSize(fontSize).text(lines, options);
        };

        // Title
        addText(`Oferta: ${project.name}`, 20, { align: 'center' });
        doc.moveDown(1);
        
        // Client info
        addText(`Klient: ${project.clientName}`, 14);
        if (project.clientEmail) {
          addText(`Email: ${project.clientEmail}`, 12);
        }
        if (project.clientPhone) {
          addText(`Telefon: ${project.clientPhone}`, 12);
        }
        doc.moveDown(1);

        // Offer number and date
        addText(`Numer oferty: ${templateData.offerNumber}`, 12);
        addText(`Data: ${templateData.offerDate}`, 12);
        doc.moveDown(1);

        // Description
        if (project.description) {
          addText('Opis projektu:', 14);
          addText(project.description, 12);
          doc.moveDown(1);
        }

        // Modules
        if (project.modules && project.modules.length > 0) {
          addText('Zakres prac:', 14);
          project.modules.forEach((module, index) => {
            addText(`${index + 1}. ${module.name}`, 12);
            if (module.description) {
              addText(`   ${module.description}`, 10);
            }
          });
          doc.moveDown(1);
        }

        // Timeline
        if (project.timeline) {
          addText('Harmonogram:', 14);
          if (project.timeline.phase1) {
            addText(`• ${project.timeline.phase1.name}: ${project.timeline.phase1.duration}`, 12);
          }
          if (project.timeline.phase2) {
            addText(`• ${project.timeline.phase2.name}: ${project.timeline.phase2.duration}`, 12);
          }
          if (project.timeline.phase3) {
            addText(`• ${project.timeline.phase3.name}: ${project.timeline.phase3.duration}`, 12);
          }
          if (project.timeline.phase4) {
            addText(`• ${project.timeline.phase4.name}: ${project.timeline.phase4.duration}`, 12);
          }
          doc.moveDown(1);
        }

        // Pricing
        if (project.pricing) {
          addText('Wycenienie:', 14);
          if (project.pricing.phase1 > 0) {
            addText(`Faza I: ${new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(project.pricing.phase1)}`, 12);
          }
          if (project.pricing.phase2 > 0) {
            addText(`Faza II: ${new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(project.pricing.phase2)}`, 12);
          }
          if (project.pricing.phase3 > 0) {
            addText(`Faza III: ${new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(project.pricing.phase3)}`, 12);
          }
          if (project.pricing.phase4 > 0) {
            addText(`Faza IV: ${new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(project.pricing.phase4)}`, 12);
          }
          if (project.pricing.total) {
            addText(`RAZEM: ${new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(project.pricing.total)}`, 14);
          }
          doc.moveDown(1);
        }

        // Payment terms
        if (project.customPaymentTerms) {
          addText('Warunki płatności:', 14);
          // Split payment terms by newlines and add each line separately
          const paymentLines = project.customPaymentTerms.split('\n');
          paymentLines.forEach(line => {
            if (line.trim()) {
              addText(line.trim(), 12);
            }
          });
          doc.moveDown(1);
        }

        // Contact info
        addText('Kontakt:', 12);
        addText('Jakub Czajka - Soft Synergy', 12);
        addText('Email: jakub.czajka@soft-synergy.com', 12);
        addText('Telefon: +48 793 868 886', 12);

        doc.end();
        stream.on('finish', resolve);
        stream.on('error', reject);
      } catch (e) {
        reject(e);
      }
    });

    // Update project with PDF URL
    project.pdfUrl = `/generated-offers/${pdfFileName}`;
    await project.save();

    // Log activity
    try {
      await Activity.create({
        action: 'offer.pdf.generated',
        entityType: 'project',
        entityId: project._id,
        author: req.user._id,
        message: `PDF offer generated for project "${project.name}"`,
        metadata: { pdfUrl: project.pdfUrl }
      });
    } catch (e) {
      // ignore logging errors
    }

    res.json({
      message: 'PDF oferty został wygenerowany pomyślnie',
      pdfUrl: project.pdfUrl,
      fileName: pdfFileName
    });

  } catch (error) {
    console.error('Generate PDF error:', error);
    res.status(500).json({ message: 'Błąd serwera podczas generowania PDF' });
  }
});

// Simple PDF generation endpoint without database dependency
router.post('/generate-pdf-simple', auth, async (req, res) => {
  try {
    const projectData = req.body;
    
    if (!projectData.name || !projectData.clientName) {
      return res.status(400).json({ message: 'Brakuje wymaganych danych: name, clientName' });
    }

    // Create generated-offers directory if it doesn't exist
    const outputDir = path.join(__dirname, '../generated-offers');
    await fs.mkdir(outputDir, { recursive: true });

    // Generate PDF using pdfkit
    const PDFDocument = require('pdfkit');
    const pdfFileName = `offer-${Date.now()}.pdf`;
    const pdfPath = path.join(outputDir, pdfFileName);

    await new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ 
          size: 'A4', 
          margins: { top: 50, left: 50, right: 50, bottom: 50 } 
        });
        const stream = require('fs').createWriteStream(pdfPath);
        doc.pipe(stream);

        // Helper function to clean text and handle line breaks
        const cleanText = (text) => {
          if (!text) return '';
          return text.toString()
            .replace(/[\u201C\u201D]/g, '"') // Replace smart quotes
            .replace(/[\u2018\u2019]/g, "'") // Replace smart apostrophes
            .replace(/[\u2013\u2014]/g, "-") // Replace em/en dashes
            .replace(/[\u2026]/g, "...") // Replace ellipsis
            .replace(/\s+/g, ' ') // Normalize whitespace
            .trim();
        };

        // Helper function to add text with proper line breaks
        const addText = (text, fontSize = 12, options = {}) => {
          const cleanedText = cleanText(text);
          const lines = doc.splitTextToSize(cleanedText, doc.page.width - doc.page.margins.left - doc.page.margins.right - 20);
          doc.fontSize(fontSize).text(lines, options);
        };

        // Title
        addText(`Oferta: ${projectData.name}`, 20, { align: 'center' });
        doc.moveDown(1);
        
        // Client info
        addText(`Klient: ${projectData.clientName}`, 14);
        if (projectData.clientEmail) {
          addText(`Email: ${projectData.clientEmail}`, 12);
        }
        if (projectData.clientPhone) {
          addText(`Telefon: ${projectData.clientPhone}`, 12);
        }
        doc.moveDown(1);

        // Offer number and date
        addText(`Numer oferty: ${projectData.offerNumber || `SS/${new Date().getFullYear()}/${(new Date().getMonth()+1).toString().padStart(2, '0')}/01`}`, 12);
        addText(`Data: ${new Date().toLocaleDateString('pl-PL')}`, 12);
        doc.moveDown(1);

        // Description
        if (projectData.description) {
          addText('Opis projektu:', 14);
          addText(projectData.description, 12);
          doc.moveDown(1);
        }

        // Modules
        if (projectData.modules && projectData.modules.length > 0) {
          addText('Zakres prac:', 14);
          projectData.modules.forEach((module, index) => {
            addText(`${index + 1}. ${module.name}`, 12);
            if (module.description) {
              addText(`   ${module.description}`, 10);
            }
          });
          doc.moveDown(1);
        }

        // Timeline
        if (projectData.timeline) {
          addText('Harmonogram:', 14);
          if (projectData.timeline.phase1) {
            addText(`• ${projectData.timeline.phase1.name}: ${projectData.timeline.phase1.duration}`, 12);
          }
          if (projectData.timeline.phase2) {
            addText(`• ${projectData.timeline.phase2.name}: ${projectData.timeline.phase2.duration}`, 12);
          }
          if (projectData.timeline.phase3) {
            addText(`• ${projectData.timeline.phase3.name}: ${projectData.timeline.phase3.duration}`, 12);
          }
          if (projectData.timeline.phase4) {
            addText(`• ${projectData.timeline.phase4.name}: ${projectData.timeline.phase4.duration}`, 12);
          }
          doc.moveDown(1);
        }

        // Pricing
        if (projectData.pricing) {
          addText('Wycenienie:', 14);
          if (projectData.pricing.phase1 > 0) {
            addText(`Faza I: ${new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(projectData.pricing.phase1)}`, 12);
          }
          if (projectData.pricing.phase2 > 0) {
            addText(`Faza II: ${new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(projectData.pricing.phase2)}`, 12);
          }
          if (projectData.pricing.phase3 > 0) {
            addText(`Faza III: ${new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(projectData.pricing.phase3)}`, 12);
          }
          if (projectData.pricing.phase4 > 0) {
            addText(`Faza IV: ${new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(projectData.pricing.phase4)}`, 12);
          }
          if (projectData.pricing.total) {
            addText(`RAZEM: ${new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(projectData.pricing.total)}`, 14);
          }
          doc.moveDown(1);
        }

        // Payment terms
        if (projectData.customPaymentTerms) {
          addText('Warunki płatności:', 14);
          const paymentLines = projectData.customPaymentTerms.split('\n');
          paymentLines.forEach(line => {
            if (line.trim()) {
              addText(line.trim(), 12);
            }
          });
          doc.moveDown(1);
        }

        // Contact info
        addText('Kontakt:', 12);
        addText('Jakub Czajka - Soft Synergy', 12);
        addText('Email: jakub.czajka@soft-synergy.com', 12);
        addText('Telefon: +48 793 868 886', 12);

        doc.end();
        stream.on('finish', resolve);
        stream.on('error', reject);
      } catch (e) {
        reject(e);
      }
    });

    res.json({
      message: 'PDF oferty został wygenerowany pomyślnie',
      pdfUrl: `/generated-offers/${pdfFileName}`,
      fileName: pdfFileName
    });

  } catch (error) {
    console.error('Generate PDF error:', error);
    res.status(500).json({ message: 'Błąd serwera podczas generowania PDF' });
  }
});

// i18n for work summary
const workSummaryI18n = {
  pl: {
    companyTagline: 'Innowacyjne rozwiązania programistyczne',
    summaryTitle: 'Zestawienie Prac',
    date: 'Data',
    number: 'Numer',
    projectLabel: 'Projekt:',
    clientLabel: 'Klient:',
    intro: 'Podsumowanie',
    introText: 'Niniejsze zestawienie zawiera szczegółowy przegląd wykonanych prac w ramach projektu. Dokument przedstawia zakres realizowanych zadań, osiągnięte rezultaty oraz status projektu.',
    projectDetails: 'Szczegóły Projektu',
    projectName: 'Nazwa projektu',
    clientName: 'Klient',
    period: 'Okres realizacji',
    status: 'Status',
    completedWork: 'Wykonane Prace',
    completedDate: 'Data ukończenia',
    keyFeatures: 'Kluczowe Funkcjonalności',
    statistics: 'Statystyki Projektu',
    achievements: 'Osiągnięcia',
    technicalNotes: 'Uwagi techniczne',
    nextSteps: 'Następne kroki',
    downloadSummary: 'Pobierz zestawienie'
  },
  en: {
    companyTagline: 'Innovative Software Solutions',
    summaryTitle: 'Work Summary',
    date: 'Date',
    number: 'Number',
    projectLabel: 'Project:',
    clientLabel: 'Client:',
    intro: 'Summary',
    introText: 'This document provides a detailed overview of work completed within the project scope. It presents the range of tasks performed, achieved results, and project status.',
    projectDetails: 'Project Details',
    projectName: 'Project name',
    clientName: 'Client',
    period: 'Period',
    status: 'Status',
    completedWork: 'Completed Work',
    completedDate: 'Completion date',
    keyFeatures: 'Key Features',
    statistics: 'Project Statistics',
    achievements: 'Achievements',
    technicalNotes: 'Technical Notes',
    nextSteps: 'Next Steps',
    downloadSummary: 'Download summary'
  }
};

// Generate work summary
router.post('/generate-work-summary/:projectId', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId)
      .populate('createdBy', 'firstName lastName email');
    
    if (!project) {
      return res.status(404).json({ message: 'Projekt nie został znaleziony' });
    }

    const templatePath = path.join(__dirname, '../templates/work-summary-template.html');
    const templateContent = await fs.readFile(templatePath, 'utf8');
    const template = handlebars.compile(templateContent);
    
    const requestedLang = (req.query?.lang || '').toLowerCase();
    const lang = (requestedLang === 'en' || requestedLang === 'pl') ? requestedLang : ((project.language === 'en') ? 'en' : 'pl');
    const t = workSummaryI18n[lang] || workSummaryI18n.pl;

    // Parse work summary data from request body or use defaults
    const workSummaryData = {
      lang,
      t,
      projectName: project.name,
      clientName: project.clientName,
      summaryDate: new Date().toLocaleDateString('pl-PL'),
      summaryNumber: project.offerNumber || `WP/${new Date().getFullYear()}/${(new Date().getMonth()+1).toString().padStart(2, '0')}/${project._id.toString().slice(-4)}`,
      summaryDescription: req.body.summaryDescription || 'Dzięki wspólnej pracy udało nam się zrealizować wszystkie założone cele projektu.',
      periodStart: req.body.periodStart || new Date(project.createdAt).toLocaleDateString('pl-PL'),
      periodEnd: req.body.periodEnd || new Date().toLocaleDateString('pl-PL'),
      status: req.body.status || project.status,
      completedTasks: req.body.completedTasks || [
        {
          name: 'Analiza wymagań',
          description: 'Przeprowadzenie szczegółowej analizy potrzeb klienta',
          date: new Date().toLocaleDateString('pl-PL')
        },
        {
          name: 'Implementacja',
          description: 'Realizacja głównych funkcjonalności systemu',
          date: new Date().toLocaleDateString('pl-PL')
        }
      ],
      keyFeatures: req.body.keyFeatures || project.modules.map(m => ({
        name: m.name,
        description: m.description,
        color: m.color || 'blue'
      })),
      statistics: req.body.statistics || [
        { label: 'Dni współpracy', value: '14+' },
        { label: 'Wykonane moduły', value: '4' },
        { label: 'Satisfaction rate', value: '100%' }
      ],
      achievements: req.body.achievements || [
        {
          name: 'Terminowa realizacja',
          description: 'Projekt zakończony zgodnie z harmonogramem'
        },
        {
          name: 'Wysoka jakość',
          description: 'Wszystkie funkcjonalności spełniają najwyższe standardy'
        }
      ],
      statistics: req.body.statistics || [
        { label: 'Dni współpracy', value: '14+' },
        { label: 'Wykonane moduły', value: '4' },
        { label: 'Status projektu', value: 'W trakcie realizacji' }
      ],
      achievements: req.body.achievements || [
        {
          name: 'Terminowa realizacja',
          description: 'Projekt realizowany zgodnie z harmonogramem'
        },
        {
          name: 'Wysoka jakość',
          description: 'Wszystkie funkcjonalności spełniają wymagania'
        }
      ],
      companyEmail: 'jakub.czajka@soft-synergy.com',
      companyPhone: '+48 793 868 886'
    };

    const html = template(workSummaryData);

    const outputDir = path.join(__dirname, '../generated-offers');
    await fs.mkdir(outputDir, { recursive: true });

    // Clean up old work summary files for this project
    try {
      const existingFiles = await fs.readdir(outputDir);
      const projectFiles = existingFiles.filter(file => file.startsWith(`work-summary-${project._id}-`));
      
      for (const oldFile of projectFiles) {
        const oldFilePath = path.join(outputDir, oldFile);
        await fs.unlink(oldFilePath);
        console.log(`Deleted old work summary file: ${oldFile}`);
      }
    } catch (cleanupError) {
      console.error('Error cleaning up old work summary files:', cleanupError);
    }

    const fileName = `work-summary-${project._id}-${Date.now()}.html`;
    const filePath = path.join(outputDir, fileName);
    await fs.writeFile(filePath, html);

    // Generate PDF
    let pdfFileName = null;
    let pdfUrl = null;
    
    try {
      const PDFDocument = require('pdfkit');
      pdfFileName = `work-summary-${project._id}-${Date.now()}.pdf`;
      const pdfPath = path.join(outputDir, pdfFileName);

      await new Promise((resolve, reject) => {
        try {
          const doc = new PDFDocument({ 
            size: 'A4', 
            margins: { top: 50, left: 50, right: 50, bottom: 50 } 
          });
          const stream = require('fs').createWriteStream(pdfPath);
          doc.pipe(stream);

          const cleanText = (text) => {
            if (!text) return '';
            return text.toString()
              .replace(/[\u201C\u201D]/g, '"')
              .replace(/[\u2018\u2019]/g, "'")
              .replace(/[\u2013\u2014]/g, "-")
              .replace(/[\u2026]/g, "...")
              .replace(/\s+/g, ' ')
              .trim();
          };

          const addText = (text, fontSize = 12, options = {}) => {
            const cleanedText = cleanText(text);
            const lines = doc.splitTextToSize(cleanedText, doc.page.width - doc.page.margins.left - doc.page.margins.right - 20);
            doc.fontSize(fontSize).text(lines, options);
          };

          // Title
          addText(`Zestawienie Prac: ${project.name}`, 20, { align: 'center' });
          doc.moveDown(1);
          
          // Client info
          addText(`Klient: ${project.clientName}`, 14);
          addText(`Numer zestawienia: ${workSummaryData.summaryNumber}`, 12);
          addText(`Data: ${workSummaryData.summaryDate}`, 12);
          doc.moveDown(1);

          // Description
          if (workSummaryData.summaryDescription) {
            addText('Opis zestawienia:', 14);
            addText(workSummaryData.summaryDescription, 12);
            doc.moveDown(1);
          }

          // Project details
          addText('Szczegóły projektu:', 14);
          addText(`Okres realizacji: ${workSummaryData.periodStart} - ${workSummaryData.periodEnd}`, 12);
          addText(`Status: ${workSummaryData.status}`, 12);
          doc.moveDown(1);

          // Completed tasks
          if (workSummaryData.completedTasks && workSummaryData.completedTasks.length > 0) {
            addText('Wykonane zadania:', 14);
            workSummaryData.completedTasks.forEach((task, index) => {
              if (task.name) {
                addText(`${index + 1}. ${task.name}`, 12);
                if (task.description) {
                  addText(`   ${task.description}`, 10);
                }
                if (task.date) {
                  addText(`   Data: ${task.date}`, 10);
                }
              }
            });
            doc.moveDown(1);
          }

          // Statistics
          if (workSummaryData.statistics && workSummaryData.statistics.length > 0) {
            addText('Statystyki projektu:', 14);
            workSummaryData.statistics.forEach(stat => {
              if (stat.label && stat.value) {
                addText(`• ${stat.label}: ${stat.value}`, 12);
              }
            });
            doc.moveDown(1);
          }

          // Achievements
          if (workSummaryData.achievements && workSummaryData.achievements.length > 0) {
            addText('Osiągnięcia:', 14);
            workSummaryData.achievements.forEach((achievement, index) => {
              if (achievement.name) {
                addText(`${index + 1}. ${achievement.name}`, 12);
                if (achievement.description) {
                  addText(`   ${achievement.description}`, 10);
                }
              }
            });
            doc.moveDown(1);
          }

          // Contact info
          addText('Kontakt:', 12);
          addText('Jakub Czajka - Soft Synergy', 12);
          addText('Email: jakub.czajka@soft-synergy.com', 12);
          addText('Telefon: +48 793 868 886', 12);

          doc.end();
          stream.on('finish', resolve);
          stream.on('error', reject);
        } catch (e) {
          reject(e);
        }
      });

      pdfUrl = `/generated-offers/${pdfFileName}`;
      console.log('Work summary PDF generated successfully');
    } catch (pdfError) {
      console.error('Work summary PDF generation failed:', pdfError);
    }

    // Update project with generated work summary URL
    project.workSummaryUrl = `/generated-offers/${fileName}`;
    if (pdfUrl) {
      project.workSummaryPdfUrl = pdfUrl;
    }
    await project.save();

    // Log activity
    try {
      await Activity.create({
        action: 'work-summary.generated',
        entityType: 'project',
        entityId: project._id,
        author: req.user._id,
        message: `Work summary generated for project "${project.name}"`,
        metadata: { workSummaryUrl: `/generated-offers/${fileName}` }
      });
    } catch (e) {
      // ignore logging errors
    }

    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });

    res.json({
      message: 'Zestawienie pracy zostało wygenerowane pomyślnie',
      workSummaryUrl: `/generated-offers/${fileName}`,
      workSummaryPdfUrl: pdfUrl,
      project: project
    });

  } catch (error) {
    console.error('Generate work summary error:', error);
    res.status(500).json({ message: 'Błąd serwera podczas generowania zestawienia pracy' });
  }
});

module.exports = router;
 
// Generate contract PDF (from HTML template via Puppeteer) and mark project as accepted
router.post('/generate-contract/:projectId', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId)
      .populate('createdBy', 'firstName lastName email');
    
    if (!project) {
      return res.status(404).json({ message: 'Projekt nie został znaleziony' });
    }

    // Create generated-offers directory if it doesn't exist
    const outputDir = path.join(__dirname, '../generated-offers');
    await fs.mkdir(outputDir, { recursive: true });

    // Clean old contract PDFs for this project
    try {
      const existingFiles = await fs.readdir(outputDir);
      const projectFiles = existingFiles.filter(file => file.startsWith(`contract-${project._id}-`) && file.endsWith('.pdf'));
      for (const oldFile of projectFiles) {
        await fs.unlink(path.join(outputDir, oldFile));
      }
    } catch (e) {
      console.error('Contract cleanup error:', e);
    }

    // Generate PDF with pdfkit (works on Linux servers, no headless browser)
    const PDFDocument = require('pdfkit');
    const currency = (n) => new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(n || 0);
    const pdfFileName = `contract-${project._id}-${Date.now()}.pdf`;
    const pdfPath = path.join(outputDir, pdfFileName);
    const customText = typeof req.body?.customText === 'string' ? req.body.customText.trim() : '';

    await new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ size: 'A4', margins: { top: 56, left: 56, right: 56, bottom: 56 } });
        const stream = require('fs').createWriteStream(pdfPath);
        doc.pipe(stream);

        // Register Unicode fonts (system DejaVu fonts)
        const systemRegular = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf';
        const systemBold = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf';
        try {
          doc.registerFont('Regular', systemRegular);
          doc.registerFont('Bold', systemBold);
        } catch (e) {
          // Fallback to built-in fonts if system fonts missing (may cause diacritics issues)
          doc.registerFont('Regular', 'Helvetica');
          doc.registerFont('Bold', 'Helvetica-Bold');
        }

        // Title
        doc.font('Bold').fontSize(18).text(`Umowa realizacji ${project.name}`, { align: 'left' });
        doc.moveDown(0.5);
        doc.font('Regular').fontSize(11).fillColor('#333').text(`zawarta w dniu ${new Date().toLocaleDateString('pl-PL')} pomiędzy:`);

        // Parties
        doc.moveDown(0.8);
        doc.fillColor('#000').font('Bold').fontSize(12).text('Jakub Czajka');
        doc.font('Regular').fontSize(11).text('zamieszkały w Zielonej Górze na ulicy Rydza-Śmigłego 20/9 65-610,');
        doc.text('identyfikującym się dowodem osobistym o numerze seryjnym DAJ 798974 oraz o numerze PESEL 07302001359,');
        doc.text('działający w ramach marki Soft Synergy');
        doc.moveDown(0.6);
        doc.text('a');
        doc.moveDown(0.6);
        doc.font('Bold').text('[Dane Klienta]');
        // Dotted area for client data input (with extra spacing to avoid overlap)
        const startX = doc.page.margins.left;
        const width = doc.page.width - doc.page.margins.left - doc.page.margins.right;
        let y = doc.y + 12; // push below current text
        const gap = 18;
        doc.dash(3, { space: 4 }).strokeColor('#bdbdbd').lineWidth(1);
        doc.moveTo(startX, y).lineTo(startX + width, y).stroke();
        y += gap;
        doc.moveTo(startX, y).lineTo(startX + width, y).stroke();
        y += gap;
        doc.moveTo(startX, y).lineTo(startX + width, y).stroke();
        doc.undash().strokeColor('#000');
        // move cursor below dotted block with safe margin
        doc.y = y + 16;
        doc.font('Regular').text('zwana dalej „Zamawiającym”');

        // Rule
        doc.moveDown(0.6);
        doc.strokeColor('#999').lineWidth(2).moveTo(doc.page.margins.left, doc.y).lineTo(doc.page.width - doc.page.margins.right, doc.y).stroke();

        const sectionHeader = (title) => {
          doc.moveDown(1);
          doc.font('Bold').fontSize(13).fillColor('#000').text(title);
        };
        const bulletList = (items) => {
          doc.moveDown(0.2);
          doc.font('Regular').fontSize(11).fillColor('#000');
          items.forEach((t, idx) => {
            doc.text(`${idx + 1}. ${t}`, { indent: 14 });
          });
        };

        // §1
        sectionHeader('§1. Przedmiot umowy');
        const offerDate = project.createdAt
          ? new Date(project.createdAt).toLocaleDateString('pl-PL')
          : new Date().toLocaleDateString('pl-PL');
        doc.font('Regular').fontSize(11).text(`Wykonawca zobowiązuje się do realizacji projektu "${project.name}" zgodnie z zakresem opisanym w Załączniku nr 1 (oferta z dnia ${offerDate}).`);

        // §2
        sectionHeader('§2. Zakres prac');
        const modules = Array.isArray(project.modules) && project.modules.length ? project.modules.map(m => `${m.name}: ${m.description}`) : ['Zakres zgodnie z ofertą'];
        bulletList(modules);

        // §3 – Harmonogram z danych projektu
        sectionHeader('§3. Harmonogram i czas realizacji');
        const timelineBullets = [];
        if (project.timeline?.phase1) timelineBullets.push(`${project.timeline.phase1.name}: ${project.timeline.phase1.duration}`);
        if (project.timeline?.phase2) timelineBullets.push(`${project.timeline.phase2.name}: ${project.timeline.phase2.duration}`);
        if (project.timeline?.phase3) timelineBullets.push(`${project.timeline.phase3.name}: ${project.timeline.phase3.duration}`);
        if (project.timeline?.phase4) timelineBullets.push(`${project.timeline.phase4.name}: ${project.timeline.phase4.duration}`);
        if (timelineBullets.length) {
          bulletList(timelineBullets);
        }
        doc.moveDown(0.2);
        doc.font('Regular').fontSize(11).fillColor('#000');
        doc.text(`* Prace rozpoczną się w ciągu 3 dni roboczych od odesłania podpisanej umowy.`, { indent: 14 });

        // §4 – Wynagrodzenie i płatności dynamicznie
        sectionHeader('§4. Wynagrodzenie i płatności');
        const total = currency(project?.pricing?.total || 0);
        doc.font('Regular').fontSize(11).text(`Łączne wynagrodzenie za realizację prac wynosi ${total} netto.`);
        doc.moveDown(0.2);
        const paymentLines = (project.customPaymentTerms && project.customPaymentTerms.trim().length)
          ? project.customPaymentTerms.split(/\n+/)
          : [
              `Faza I: ${currency(project?.pricing?.phase1 || 0)}`,
              `Faza II: ${currency(project?.pricing?.phase2 || 0)}`,
              `Faza III: ${currency(project?.pricing?.phase3 || 0)}`,
              `Faza IV: ${currency(project?.pricing?.phase4 || 0)}`
            ].filter(line => !line.endsWith('0,00 zł') && !line.endsWith('0,00 zł'));
        if (paymentLines.length) {
          doc.text('Warunki płatności:');
          paymentLines.forEach(t => doc.text(`• ${t}`, { indent: 14 }));
        }
        doc.moveDown(0.2);
        doc.text('Faktury VAT za powyższe kwoty wystawi firma:');
        doc.moveDown(0.2);
        doc.font('Bold').text('FUNDACJA AIP');
        doc.font('Regular').text('NIP: 5242495143');
        doc.text('ul. ALEJA KSIĘCIA JÓZEFA PONIATOWSKIEGO 1/ — 03-901');
        doc.text('WARSZAWA MAZOWIECKIE');
        doc.text('email: jakub.czajka@soft-synergy.com');
        doc.text('Numer telefonu: +48 793 868 886');
        doc.text('jako podmiot świadczący usługę na rzecz Wykonawcy.');
        doc.moveDown(0.2);
        doc.text('Płatność faktur będzie traktowana jako spełnienie zobowiązania wobec Wykonawcy.');

        // §5
        sectionHeader('§5. Zwrot zaliczki i odstąpienie');
        bulletList([
          'W przypadku niemożliwości realizacji projektu z przyczyn niezależnych od Wykonawcy, Wykonawca może odstąpić od umowy i zobowiązuje się do pełnego zwrotu zaliczki w terminie do 5 dni roboczych.',
          'W takim przypadku żadna ze stron nie będzie dochodziła dalszych roszczeń.'
        ]);

        // §6
        sectionHeader('§6. Odbiór i gwarancja');
        bulletList([
          'Zamawiający zobowiązuje się do odbioru prac po zakończeniu realizacji.',
          'Błędy zgłoszone w okresie 3 miesięcy od odbioru będą poprawiane nieodpłatnie.',
          'Gwarancja nie obejmuje zmian funkcjonalnych ani rozbudowy.'
        ]);

        // §7
        sectionHeader('§7. Postanowienia końcowe');
        bulletList([
          'Strony dopuszczają kontakt i ustalenia drogą mailową jako formę wiążącą.',
          'Spory będą rozstrzygane polubownie, a w razie potrzeby przez sąd właściwy dla miejsca zamieszkania Wykonawcy.',
          'W sprawach nieuregulowanych stosuje się przepisy Kodeksu cywilnego.'
        ]);

        // Signatures
        doc.moveDown(2);
        const yStart = doc.y;
        const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
        const colWidth = pageWidth / 2 - 10;
        // Left
        doc.moveTo(doc.page.margins.left, yStart + 30).lineTo(doc.page.margins.left + colWidth, yStart + 30).strokeColor('#000').lineWidth(1).stroke();
        doc.font('Regular').fontSize(10).text('Zamawiający', doc.page.margins.left, yStart + 35, { width: colWidth, align: 'left' });
        // Right
        const rightX = doc.page.margins.left + colWidth + 20;
        const lineY = yStart + 30;
        doc.moveTo(rightX, lineY).lineTo(rightX + colWidth, lineY).stroke();
        // Signature image (2x bigger, placed below the line, offset by 25px)
        try {
          const sigPath = path.join(__dirname, '../public/img/podpis-jakub-czajka.jpg');
          const sigWidth = 240; // 2x bigger
          const sigX = rightX + colWidth - sigWidth;
          const sigY = lineY + 25; // 25px below the line to avoid overlap
          doc.image(sigPath, sigX, sigY, { width: sigWidth, align: 'right' });
        } catch (e) {
          // ignore if image not found
        }
        // Place caption under the signature image
        doc.font('Regular').text('Jakub Czajka\ndziałający w ramach marki Soft Synergy', rightX, lineY + 25 + 70, { width: colWidth, align: 'right' });

        doc.end();
        stream.on('finish', resolve);
        stream.on('error', reject);
      } catch (e) {
        reject(e);
      }
    });

    // Save on project and mark accepted
    project.contractPdfUrl = `/generated-offers/${pdfFileName}`;
    project.status = 'accepted';
    await project.save();

    // Log activity
    try {
      await Activity.create({
        action: 'contract.generated',
        entityType: 'project',
        entityId: project._id,
        author: req.user._id,
        message: `Contract generated and project accepted: "${project.name}"`,
        metadata: { contractPdfUrl: project.contractPdfUrl }
      });
    } catch (e) {}

    // Response with URLs
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });

    return res.json({
      message: 'Umowa została wygenerowana, status ustawiono na zaakceptowany',
      contractPdfUrl: project.contractPdfUrl,
      project
    });
  } catch (error) {
    console.error('Generate contract error:', error);
    return res.status(500).json({ message: 'Błąd serwera podczas generowania umowy' });
  }
});

// Return an editable draft of the contract text before PDF generation
router.get('/contract-draft/:projectId', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);
    if (!project) {
      return res.status(404).json({ message: 'Projekt nie został znaleziony' });
    }

    const currency = (n) => new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' }).format(n || 0);

    const lines = [];
    lines.push(`Umowa realizacji ${project.name}`);
    lines.push(`zawarta w dniu ${new Date().toLocaleDateString('pl-PL')} pomiędzy:`);
    lines.push(`Jakub Czajka, działający w ramach marki Soft Synergy`);
    lines.push('a');
    lines.push('[Dane Klienta]');
    lines.push('zwana dalej „Zamawiającym”');
    lines.push('');
    lines.push('§1. Przedmiot umowy');
    lines.push(`Wykonawca zobowiązuje się do realizacji projektu "${project.name}", zgodnie z zakresem opisanym w Załączniku nr 1 (oferta z dnia ${new Date().toLocaleDateString('pl-PL')}).`);
    lines.push('');
    lines.push('§2. Zakres prac');
    const modules = Array.isArray(project.modules) && project.modules.length ? project.modules : [{ name: 'Zakres', description: 'zgodnie z ofertą' }];
    modules.forEach((m, i) => lines.push(`${i + 1}. ${m.name}: ${m.description}`));
    lines.push('');
    lines.push('§3. Harmonogram i czas realizacji');
    if (project.timeline?.phase1) lines.push(`- ${project.timeline.phase1.name}: ${project.timeline.phase1.duration}`);
    if (project.timeline?.phase2) lines.push(`- ${project.timeline.phase2.name}: ${project.timeline.phase2.duration}`);
    if (project.timeline?.phase3) lines.push(`- ${project.timeline.phase3.name}: ${project.timeline.phase3.duration}`);
    if (project.timeline?.phase4) lines.push(`- ${project.timeline.phase4.name}: ${project.timeline.phase4.duration}`);
    lines.push('- Prace rozpoczną się w ciągu 3 dni roboczych od odesłania podpisanej umowy.');
    lines.push('');
    lines.push('§4. Wynagrodzenie i płatności');
    lines.push(`Łączne wynagrodzenie za realizację prac wynosi ${currency(project?.pricing?.total || 0)} netto.`);
    const paymentLines = (project.customPaymentTerms && project.customPaymentTerms.trim().length)
      ? project.customPaymentTerms.split(/\n+/)
      : [
          `Faza I: ${currency(project?.pricing?.phase1 || 0)}`,
          `Faza II: ${currency(project?.pricing?.phase2 || 0)}`,
          `Faza III: ${currency(project?.pricing?.phase3 || 0)}`,
          `Faza IV: ${currency(project?.pricing?.phase4 || 0)}`
        ];
    paymentLines.forEach((l) => lines.push(`- ${l}`));
    lines.push('');
    lines.push('§5. Zwrot zaliczki i odstąpienie');
    lines.push('1. W przypadku niemożliwości realizacji projektu z przyczyn niezależnych od Wykonawcy, Wykonawca może odstąpić od umowy i zobowiązuje się do pełnego zwrotu zaliczki w terminie do 5 dni roboczych.');
    lines.push('2. W przypadku odstąpienia od umowy przez Zamawiającego po rozpoczęciu prac, zaliczka nie podlega zwrotowi i zostaje zatrzymana przez Wykonawcę na poczet już wykonanych prac.');
    lines.push('');
    lines.push('§6. Odbiór i gwarancja');
    lines.push('1. Zamawiający zobowiązuje się do odbioru prac po zakończeniu realizacji.');
    lines.push('2. Błędy zgłoszone w okresie 3 miesięcy od odbioru będą poprawiane nieodpłatnie.');
    lines.push('3. Gwarancja nie obejmuje zmian funkcjonalnych ani rozbudowy.');
    lines.push('');
    // Dodajemy nowy paragraf dotyczący spotkań i kary umownej
    lines.push('§7. Spotkania projektowe i kara umowna');
    lines.push('1. Strony mogą umawiać się na spotkania dotyczące realizacji projektu w formie zdalnej.');
    lines.push('2. Ustalenie terminu spotkania następuje za zgodą obu stron, z wyprzedzeniem co najmniej 24 godzin.');
    lines.push('3. W przypadku nieobecności Zamawiającego na umówionym spotkaniu bez wcześniejszego odwołania (najpóźniej 2 godziny przed spotkaniem), Zamawiający zobowiązuje się do zapłaty kary umownej w wysokości 100,00 zł za każde takie zdarzenie.');
    lines.push('');
    lines.push('§8. Postanowienia końcowe');
    lines.push('1. Strony dopuszczają kontakt i ustalenia drogą mailową jako formę wiążącą.');
    lines.push('2. Spory będą rozstrzygane polubownie, a w razie potrzeby przez sąd właściwy dla miejsca zamieszkania Wykonawcy.');
    lines.push('3. W sprawach nieuregulowanych stosuje się przepisy Kodeksu cywilnego.');

    res.json({ draft: lines.join('\n') });
  } catch (error) {
    console.error('Contract draft error:', error);
    res.status(500).json({ message: 'Błąd serwera podczas generowania szkicu umowy' });
  }
});