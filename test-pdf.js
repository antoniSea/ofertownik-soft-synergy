const axios = require('axios');

const testData = {
  name: "Aplikacja AI dla analizy danych",
  clientName: "Test Client",
  clientEmail: "test@example.com",
  clientPhone: "+48 123 456 789",
  description: "Centralny element aplikacji stanowi moduł AI do analizy danych użytkownika w realizacji zadań. System oferuje zaawansowane analizy, rekomendacje oraz automatyzację procesów. Makiety i prototyp koncentrują się na interakcji użytkownika z tym modułem, uwzględniając strukturę planów konwersacyjnych, systemu rekomendacji oraz ustawień. Projekt zakłada przejrzysty interfejs, wysoką wydajność oraz możliwość rozbudowy o kolejne funkcje AI.",
  modules: [
    {
      name: "Moduł AI",
      description: "Analiza danych i rekomendacje"
    },
    {
      name: "Interfejs użytkownika", 
      description: "Przejrzysty i intuicyjny"
    }
  ],
  timeline: {
    phase1: { name: "Analiza i strategia UX", duration: "5 dni roboczych" },
    phase2: { name: "Opracowanie UX Flow i makiet low-fi", duration: "6 dni roboczych" },
    phase3: { name: "Projekt makiet hi-fi i interaktywny prototyp", duration: "7 dni roboczych" },
    phase4: { name: "Opracowanie Design Systemu", duration: "5 dni roboczych" }
  },
  pricing: {
    phase1: 5000,
    phase2: 6000,
    phase3: 7000,
    phase4: 5000,
    total: 23000
  },
  customPaymentTerms: "10% zaliczki po podpisaniu umowy.\n90% po odbiorze końcowym projektu."
};

async function testPdfGeneration() {
  try {
    console.log('Testing PDF generation...');
    
    const response = await axios.post('http://localhost:5001/api/offers/generate-pdf-simple', testData, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token' // You might need to get a real token
      }
    });
    
    console.log('Success!', response.data);
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

testPdfGeneration();
