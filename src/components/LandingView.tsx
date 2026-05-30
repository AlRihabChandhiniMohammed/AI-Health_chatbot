/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from "motion/react";
import { Bot, Activity, MapPin, Heart, ShieldAlert, BookOpen, Volume2, Globe } from "lucide-react";

interface LandingViewProps {
  onNavigate: (view: string) => void;
  selectedLanguage?: 'en' | 'hi' | 'te';
}

export default function LandingView({ onNavigate, selectedLanguage = "en" }: LandingViewProps) {
  const dictionary = {
    en: {
      tag: "Next-Gen AI Clinical Platform",
      h1: "Your AI-Powered Healthcare Companion",
      pSub: "Get trusted health guidance, symptom analysis, nearby healthcare providers, and personalized assistance instantly.",
      btnChat: "Start Consultation Chat",
      btnSymptom: "Analyze Symptoms",
      stats: {
        uptime: "Uptime SLA Rating",
        latency: "Average Response Latency",
        mapped: "Medical Places Mapped",
        langs: "Language Protocols"
      },
      headers: {
        features: "Comprehensive Healthcare Intelligence",
        featuresSub: "A unified full-stack engine providing advanced clinical advice, geographic hospital matching, and personalized diagnostics records.",
        how: "How Your Copilot Operates",
        howSub: "Follow our simple, intuitive workspace workflow designed to output clinical summaries within seconds.",
        testimonials: "Loved By Patients Worldwide",
        faq: "Frequently Asked Questions",
        disclaimerTitle: "CRITICAL MEDICAL DISCLAIMER:",
        disclaimerText: "AI responses are informational only and are not a substitute for professional medical advice. If you are experiencing a life-threatening acute crisis or chest pain, please immediately call local emergency services or seek care at the nearest specialized hospital center."
      },
      testimonials: [
        { text: `"The symptom checker analyzed my throat pain and correctly suggested I see an ENT clinic instead of waiting. The diagnostic directory integrated maps perfectly!"`, author: "- Rajdeep S., New Delhi" },
        { text: `"Absolutely stunning full-stack design! I saved my regular pediatrician details and was able to translate clinical instructions to Hindi for my grandmother."`, author: "- Priya T., Hyderabad" },
        { text: `"The emergency help feature gives extremely precise local clinics mapping. The voice translation TTS read out medical recommendations beautifully!"`, author: "- Charles K., Bengaluru" }
      ]
    },
    hi: {
      tag: "अगली पीढ़ी का एआई क्लिनिकल प्लेटफॉर्म",
      h1: "आपका एआई-संचालित स्वास्थ्य सेवा साथी",
      pSub: "विश्वसनीय स्वास्थ्य मार्गदर्शन, लक्षण विश्लेषण, आस-पास के स्वास्थ्य सेवा प्रदाता और व्यक्तिगत चिकित्सा सहायता तुरंत प्राप्त करें।",
      btnChat: "परामर्श चैट शुरू करें",
      btnSymptom: "लक्षणों का विश्लेषण करें",
      stats: {
        uptime: "अपटाइम एसएलए रेटिंग",
        latency: "औसत प्रतिक्रिया विलंबता",
        mapped: "मैप किए गए चिकित्सा केंद्र",
        langs: "मूल भाषा प्रोटोकॉल"
      },
      headers: {
        features: "व्यापक स्वास्थ्य सेवा बुद्धिमत्ता",
        featuresSub: "एक एकीकृत पूर्ण-स्टैक इंजन जो उन्नत नैदानिक सलाह, भौगोलिक अस्पताल मिलान और व्यक्तिगत निदान रिकॉर्ड प्रदान करता है।",
        how: "यह कैसे काम करता है",
        howSub: "सेकंड के भीतर नैदानिक सारांश प्राप्त करने के लिए हमारे सरल, सहज वर्कफ़्लो का पालन करें।",
        testimonials: "दुनिया भर के लोगों द्वारा पसंदीदा",
        faq: "अक्सर पूछे जाने वाले प्रश्न",
        disclaimerTitle: "महत्वपूर्ण चिकित्सा अस्वीकरण:",
        disclaimerText: "एआई प्रतिक्रियाएं केवल सूचनात्मक हैं और पेशेवर चिकित्सा सलाह का विकल्प नहीं हैं। यदि आप जानलेवा संकट या छाती में दर्द का अनुभव कर रहे हैं, तो तुरंत स्थानीय आपातकालीन सेवाओं को कॉल करें या निकटतम अस्पताल में जाएं।"
      },
      testimonials: [
        { text: `"लक्षण जांचकर्ता ने मेरे गले के दर्द का विश्लेषण किया और बिना प्रतीक्षा किए ईएनटी क्लिनिक में जाने का सही सुझाव दिया। उत्कृष्ट अनुप्रयोग!"`, author: "- राजदीप एस., नई दिल्ली" },
        { text: `"बिल्कुल शानदार डिज़ाइन! मैंने अपने नियमित बाल रोग विशेषज्ञ का विवरण सहेजा और अपनी दादी के लिए नैदानिक निर्देशों का अनुवाद हिंदी में करने में सक्षम हुई।"`, author: "- प्रिया टी., हैदराबाद" },
        { text: `"आपातकालीन सेवाए सुविधा अत्यधिक सटीक स्थानीय क्लीनिकों का पता लगाती है। आवाज अनुवाद (TTS) ने चिकित्सा सिफारिशों को खूबसूरती से सुनाया!"`, author: "- चार्ल्स के., बेंगलुरु" }
      ]
    },
    te: {
      tag: "తదుపరి తరం AI క్లినికల్ ప్లాట్‌ఫారమ్",
      h1: "మీ AI-ఆధారిత ఆరోగ్య సంరక్షణ సహాయకుడు",
      pSub: "నమ్మకమైన ఆరోగ్య మార్గదర్శకత్వం, లక్షణ విశ్లేషణ, సమీప ఆరోగ్య సంరక్షణ ప్రదాతలు మరియు వ్యక్తిగతీకరించిన సహాయాన్ని తక్షణమే పొందండి.",
      btnChat: "సంప్రదింపు చాట్ ప్రారంభించండి",
      btnSymptom: "లక్షణాలను విశ్లేషించండి",
      stats: {
        uptime: "అప్‌టైమ్ SLA రేటింగ్",
        latency: "సగటు ప్రతిస్పందన ఆలస్యం",
        mapped: "మ్యాప్ చేయబడిన వైద్య స్థలాలు",
        langs: "భాషా ప్రోటోకాల్స్"
      },
      headers: {
        features: "సమగ్ర ఆరోగ్య సంరక్షణ ఇంటెలిజెన్స్",
        featuresSub: "అధునాతన క్లినికల్ సలహా, భౌగోళిక ఆసుపత్రి సరిపోలిక మరియు వ్యక్తిగతీకరించిన విశ్లేషణ నివేదికలను అందించే ఏకీకృత వేదిక.",
        how: "ఆపరేషన్ విధానం",
        howSub: "కొద్ది సెకన్లలోనే క్లినికల్ నివేదికలను పొందడానికి మా సరళమైన, స్పష్టమైన వర్క్‌ఫ్లోను అనుసరించండి.",
        testimonials: "ప్రపంచవ్యాప్తంగా రోగుల ఆదరణ",
        faq: "తరచుగా అడిగే ప్రశ్నలు",
        disclaimerTitle: "ముఖ్యమైన వైద్య నిరాకరణ:",
        disclaimerText: "AI ప్రతిస్పందనలు సమాచారం కోసం మాత్రమే మరియు వృత్తిపరమైన వైద్య సలహాకు ప్రత్యామ్నాయం కాదు. నిండు ప్రాణాల ముప్పు ఉన్నప్పుడు వెంటనే అత్యవసర సేవలను సంప్రదించండి."
      },
      testimonials: [
        { text: `"సింప్టమ్ చెకర్ నా గొంతు నొప్పిని విశ్లేషించి, వెంటనే ENT క్లినిక్‌ని సంప్రదించమని నిష్పాక్షికంగా సూచించింది. మ్యాప్స్ చాలా సమర్ధవంతంగా పనిచేసింది."`, author: "- రాజ్‌దీప్ ఎస్., న్యూఢిల్లీ" },
        { text: `"అద్భుతమైన ఫుల్-స్టాక్ డిజైన్! నేను నా రెగ్యులర్ పీడియాట్రిషియన్ వివరాలను సేవ్ చేసుకోగలిగాను, అలాగే నా నాన్నమ్మ కోసం వైద్య సమాచారాన్ని తెలుగులో మార్చగలిగాను."`, author: "- ప్రియా టి., హైదరాబాద్" },
        { text: `"ఎమర్జెన్సీ ఫీచర్ సమీప క్లినిక్‌లను చాలా సరిగ్గా మ్యాప్ చేస్తుంది. వాయిస్ ట్రాన్స్‌లేషన్ TTS సమాచారాన్ని తెలుగులో స్పష్టంగా చదివి వినిపించింది!"`, author: "- చార్లెస్ కె., బెంగళూరు" }
      ]
    }
  };

  const t = dictionary[selectedLanguage] || dictionary.en;

  const features = [
    {
      icon: <Bot className="w-6 h-6 text-sky-500" />,
      title: selectedLanguage === "hi" ? "एआई स्वास्थ्य सहायक" : selectedLanguage === "te" ? "AI ఆరోగ్య సహాయకుడు" : "AI Health Assistant",
      desc: selectedLanguage === "hi" 
        ? "सुरक्षित चिकित्सा खुफिया बैकएंड का उपयोग करके नैदानिक ​​प्रश्नों के त्वरित उत्तर। हिंदी और तेलुगु के लिए समर्थन।" 
        : selectedLanguage === "te" 
          ? "సురక్షితమైన వైద్య మేధస్సు బ్యాకెండ్ ఉపయోగించి క్లినికల్ ప్రశ్నలకు తక్షణ సమాధానాలు. హిందీ మరియు తెలుగు మద్దతు." 
          : "Instant responses to clinical query topics using a secure medical intelligence backend. Support for Hindi and Telugu."
    },
    {
      icon: <Activity className="w-6 h-6 text-teal-500" />,
      title: selectedLanguage === "hi" ? "लक्षण लक्षण-जांच" : selectedLanguage === "te" ? "లక్షణాల విశ్లేషణ" : "Symptom Scoping",
      desc: selectedLanguage === "hi"
        ? "संभावित स्थितियों, नैदानिक ​​विश्वास प्रतिशत और आपातकालीन जोखिमों का विवरण देने वाली पूर्ण जांच प्रक्रिया।"
        : selectedLanguage === "te"
          ? "సాధ్యమయ్యే పరిస్థితులు, క్లినికల్ నమ్మకం శాతాలు మరియు అత్యవసర ప్రమాదాల పూర్తి స్క్రీనింగ్ పరీక్ష."
          : "Complete screening check-ups detailing plausible conditions, clinical confidence percentages, and emergency risks."
    },
    {
      icon: <MapPin className="w-6 h-6 text-green-500" />,
      title: selectedLanguage === "hi" ? "अस्पताल और फार्मेसी खोजक" : selectedLanguage === "te" ? "ఆసుపత్రులు & ఫార్మసీలు" : "Hospitals & Pharmacies Finder",
      desc: selectedLanguage === "hi"
        ? "गूगल मैप्स का उपयोग करके आस-पास के चिकित्सा केंद्रों, फार्मेसियों और डायग्नोस्टिक्स को एकीकृत करने वाला लाइव स्थानिक मानचित्र।"
        : selectedLanguage === "te"
          ? "గూగుల్ మ్యాప్స్ ఉపయోగించి సమీప వైద్య కేంద్రాలు, ఫార్మసీలు మరియు విశ్లేషణలను అనుసంధానించే ప్రత్యక్ష మ్యాపింగ్."
          : "Live spatial mapping integrating nearby medical centers, pharmacy dispensaries, and diagnostics using Google Maps."
    },
    {
      icon: <Heart className="w-6 h-6 text-red-500" />,
      title: selectedLanguage === "hi" ? "डॉक्टर खोज रजिस्ट्री" : selectedLanguage === "te" ? "వైద్యుల శోధన" : "Doctor Discovery Registry",
      desc: selectedLanguage === "hi"
        ? "अनुभव, क्लिनिकल रेटिंग, समय और शुल्क के आधार पर सॉर्ट किए गए प्रमाणित चिकित्सकों और विशेषज्ञों की खोज करें।"
        : selectedLanguage === "te"
          ? "అనుభవం, క్లినికల్ రేటింగ్‌లు, సమయపాలన మరియు ఫీజు ఆధారంగా క్రమబద్ధీకరించబడిన ధృవీకరించబడిన వైద్యులను కనుగొనండి."
          : "Discover certified clinicians and specialists sorted based on experience, clinical ratings, scheduling, and fees."
    },
    {
      icon: <Volume2 className="w-6 h-6 text-indigo-500" />,
      title: selectedLanguage === "hi" ? "आवाज भाषण सहायक एआई" : selectedLanguage === "te" ? "వాయిస్ స్పీచ్ అసిస్ట్ AI" : "Vocal Speech Assist AI",
      desc: selectedLanguage === "hi"
        ? "बोले गए नैदानिक ​​मार्गदर्शन को सुनें या अपने माइक्रोफ़ोन में डिक्टेट करके टाइप करें। पूर्ण ऑडियो समर्थन।"
        : selectedLanguage === "te"
          ? "లభించిన క్లినికల్ సమాచారాన్ని తెలుగు వాయిస్‌లో వినండి లేదా మైక్రోఫోన్‌లో మాట్లాడి టైప్ చేయండి."
          : "Listen to spoken clinical guidance or type by dictating into your microphone with native audio support."
    },
    {
      icon: <BookOpen className="w-6 h-6 text-amber-500" />,
      title: selectedLanguage === "hi" ? "चिकित्सा ज्ञानकोष" : selectedLanguage === "te" ? "వైద్య విజ్ఞాన కోశం" : "Medical Knowledge Base",
      desc: selectedLanguage === "hi"
        ? "दीर्घकालिक बीमारियों, अस्थमा, हृदय-स्वास्थ्य और महिला स्वास्थ्य का विवरण देने वाली खोज योग्य श्रेणियां।"
        : selectedLanguage === "te"
          ? "దీర్ఘకాలిక వ్యాధులు, ఆస్తమా, గుండె ఆరోగ్యం మరియు మహిళల ఆరోగ్యం గురించిన శోధించదగిన విజ్ఞాన కోశం."
          : "Searchable encyclopedic categories detailing chronic illnesses, asthma, cardio-health, and women's health."
    }
  ];

  const steps = [
    { 
      num: "01", 
      title: selectedLanguage === "hi" ? "कार्यप्रवाह चुनें" : selectedLanguage === "te" ? "వర్క్‌ఫ్లో ఎంచుకోండి" : "Select Workflow", 
      desc: selectedLanguage === "hi" 
        ? "चुनें कि क्या आप लक्षण जांच, चिकित्सक रजिस्ट्री, या चैट का अनुरोध करना चाहते हैं।" 
        : selectedLanguage === "te" 
          ? "మీరు లక్షణాల పరీక్షను కోరుకుంటున్నారా, వైద్యుల శోధన లేదా చాట్ చేయాలనుకుంటున్నారా ఎంచుకోండి." 
          : "Choose whether you request a symptom check, physician registry, or chat." 
    },
    { 
      num: "02", 
      title: selectedLanguage === "hi" ? "लक्षणों का वर्णन करें" : selectedLanguage === "te" ? "లక్షణాలను వివరించండి" : "Describe Symptoms", 
      desc: selectedLanguage === "hi"
        ? "शारीरिक संकेतक, अवधि समयरेखा और मुख्य जनसांख्यिकीय मार्कर दर्ज करें।"
        : selectedLanguage === "te"
          ? "శారీరక సూచికలు, కాలక్రమం మరియు కీలక జనాభా గుర్తులను నమోదు చేయండి."
          : "Input physical indicators, duration timeline, and key demographic markers." 
    },
    { 
      num: "03", 
      title: selectedLanguage === "hi" ? "मूल्यांकन की समीक्षा करें" : selectedLanguage === "te" ? "సమీక్ష నివేదిక" : "Review Assessment", 
      desc: selectedLanguage === "hi"
        ? "जेमिनी द्वारा सुरक्षित रूप से संकलित संभावित निदान और कार्रवाई योग्य सलाह ब्राउज़ करें।"
        : selectedLanguage === "te"
          ? "జెమిని సురక్షితంగా రూపొందించిన విశ్లేషణ మరియు కార్యాచరణ సలహాలను బ్రౌజ్ చేయండి."
          : "Browse plausible diagnoses and actionable advice securely compiled by Gemini." 
    },
    { 
      num: "04", 
      title: selectedLanguage === "hi" ? "समाधान खोजें" : selectedLanguage === "te" ? "సమీప పరిష్కారాలు" : "Discover Solutions", 
      desc: selectedLanguage === "hi"
        ? "प्रत्यक्ष देखभाल के लिए आस-पास के भौतिक विशेषज्ञ अस्पतालों या फार्मेसी केंद्रों का पता लगाएं।"
        : selectedLanguage === "te"
          ? "ప్రత్యక్ష చికిత్స కోసం సమీపంలోని ఆసుపత్రులు లేదా ఫార్మసీల చిరునామా కనుగొనండి."
          : "Locate physical specialist hospitals or pharmacies nearby for direct care." 
    }
  ];

  const faqs = [
    { 
      q: selectedLanguage === "hi" ? "क्या यह डॉक्टर का विकल्प है?" : selectedLanguage === "te" ? "ఇది నిజమైన వైద్యుడికి ప్రత్యామ్నాయమా?" : "Is this a substitute for a real doctor?", 
      a: selectedLanguage === "hi"
        ? "नहीं। यह प्रणाली केवल पूरक जानकारी प्रदान करने के लिए है। हमेशा डॉक्टर से संपर्क करें।"
        : selectedLanguage === "te"
          ? "కాదు. ఈ వ్యవస్థ ప్రాథమిక సమాచారం అందించడం కొరకు మాత్రమే. ఎల్లప్పుడూ వైద్యుడిని సంప్రదించండి."
          : "No. The system is designed to provide auxiliary triage information only and must never override formal clinical consultations of a physician. Always refer to a doctor." 
    },
    { 
      q: selectedLanguage === "hi" ? "क्या मेरा चिकित्सा डेटा सुरक्षित है?" : selectedLanguage === "te" ? "నా వైద్య సమాచారం సురక్షితంగా ఉంటుందా?" : "Is my medical data securely stored?", 
      a: selectedLanguage === "hi"
        ? "हाँ। आपके सभी दस्तावेज और इतिहास एन्क्रिप्टेड क्लाउड डेटाबेस पर सुरक्षित रूप से सहेजे जाते हैं।"
        : selectedLanguage === "te"
          ? "అవును. మీ నివేదికలు మరియు పట్టికలు సురక్షితమైన, ఎన్‌క్రిప్ట్ చేయబడిన క్లౌడ్ డేటాబేస్‌లో దాచబడతాయి."
          : "Yes. All your shortlists and logs are saved on a secure, encrypted cloud database utilizing isolated ownership security rules." 
    },
    { 
      q: selectedLanguage === "hi" ? "कौन सी भाषाएं समर्थित हैं?" : selectedLanguage === "te" ? "ఏ భాషలలో సహాయం లభిస్తుంది?" : "Which languages are supported?", 
      a: selectedLanguage === "hi"
        ? "मंच त्वरित अनुवाद क्षमताओं के साथ अंग्रेजी, हिंदी (हिंदी) और तेलुगु (తెలుగు) का समर्थन करता है।"
        : selectedLanguage === "te"
          ? "ఈ ప్లాట్‌ఫారమ్ ఇంగ్లీష్, హిందీ (हिंदी) మరియు తెలుగు (తెలుగు) అనువాదాలకు మద్దతు ఇస్తుంది."
          : "The platform supports English, Hindi (हिंदी), and Telugu (తెలుగు) with instant translation capabilities." 
    }
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* 1. HERO SECTION */}
      <section className="relative py-20 px-6 max-w-7xl mx-auto flex flex-col items-center text-center overflow-hidden">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl"
        >
          <span className="px-4 py-1.5 rounded-full bg-sky-100 text-sky-700 text-xs font-semibold uppercase tracking-wider inline-flex items-center gap-1.5 mb-6">
            <Bot className="w-4 h-4" /> {t.tag}
          </span>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold font-sans tracking-tight text-slate-900 mb-6 leading-tight whitespace-pre-line">
            {t.h1.split(" Healthcare ")[0]} <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-600 to-teal-500">
              {selectedLanguage === "hi" ? "स्वास्थ्य सेवा साथी" : selectedLanguage === "te" ? "ఆరోగ్య సహాయకుడు" : "Healthcare Companion"}
            </span>
          </h1>
          <p className="text-lg text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed">
            {t.pSub}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => onNavigate("chat")}
              className="px-8 py-4 rounded-xl bg-sky-600 text-white font-medium hover:bg-sky-500 transition-colors shadow-lg shadow-sky-500/20 text-md cursor-pointer"
            >
              {t.btnChat}
            </button>
            <button
              onClick={() => onNavigate("symptoms")}
              className="px-8 py-4 rounded-xl bg-white text-slate-700 font-medium hover:bg-slate-50 transition-colors border border-slate-200 shadow-sm text-md cursor-pointer"
            >
              {t.btnSymptom}
            </button>
          </div>
        </motion.div>

        {/* Decorative background blurs */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-sky-200/30 rounded-full blur-3xl -z-10" />
        <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-teal-200/30 rounded-full blur-3xl -z-10" />
      </section>

      {/* 2. STATS BAR */}
      <section className="bg-slate-900 text-white py-12 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div>
            <p className="text-3xl md:text-4xl font-bold font-mono text-sky-400">99.4%</p>
            <p className="text-sm text-slate-400 mt-1">{t.stats.uptime}</p>
          </div>
          <div>
            <p className="text-3xl md:text-4xl font-bold font-mono text-teal-400">3 Secs</p>
            <p className="text-sm text-slate-400 mt-1">{t.stats.latency}</p>
          </div>
          <div>
            <p className="text-3xl md:text-4xl font-bold font-mono text-green-400">20,000+</p>
            <p className="text-sm text-slate-400 mt-1">{t.stats.mapped}</p>
          </div>
          <div>
            <p className="text-3xl md:text-4xl font-bold font-mono text-amber-400">3 Native</p>
            <p className="text-sm text-slate-400 mt-1">{t.stats.langs}</p>
          </div>
        </div>
      </section>

      {/* 3. FEATURES SECTION */}
      <section className="py-20 px-6 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 mb-4 font-sans">
            {t.headers.features}
          </h2>
          <p className="text-slate-500 max-w-2xl mx-auto text-sm leading-relaxed">
            {t.headers.featuresSub}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="p-8 rounded-2xl bg-white border border-slate-100 hover:border-slate-200 transition-all hover:shadow-md group"
            >
              <div className="p-3 bg-slate-50 rounded-xl inline-block mb-5 group-hover:bg-slate-100 transition-colors">
                {feat.icon}
              </div>
              <h3 className="text-sm font-bold text-slate-900 mb-2">{feat.title}</h3>
              <p className="text-slate-500 text-xs leading-relaxed">{feat.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* 4. HOW IT WORKS */}
      <section className="bg-slate-50 py-20 px-6 border-y border-slate-100">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 mb-4 font-sans">
              {t.headers.how}
            </h2>
            <p className="text-slate-500 max-w-2xl mx-auto text-sm">
              {t.headers.howSub}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {steps.map((st, i) => (
              <div key={i} className="relative p-6 bg-white rounded-2xl shadow-sm border border-slate-100">
                <span className="absolute top-4 right-4 text-3xl font-bold font-mono text-slate-100">
                  {st.num}
                </span>
                <h3 className="text-sm font-bold text-slate-900 mt-4 mb-2">{st.title}</h3>
                <p className="text-slate-500 text-xs leading-relaxed">{st.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. TESTIMONIALS */}
      <section className="py-20 px-6 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 mb-4 font-sans">
            {t.headers.testimonials}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {t.testimonials.map((testi, i) => (
            <div key={i} className="p-6 rounded-2xl bg-white border border-slate-100 italic text-slate-600 text-xs leading-relaxed">
              <p className="mb-4">{testi.text}</p>
              <span className="font-semibold text-slate-800 not-italic block">{testi.author}</span>
            </div>
          ))}
        </div>
      </section>

      {/* 6. FAQ */}
      <section className="bg-slate-50 py-20 px-6 border-t border-slate-100">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold tracking-tight text-center text-slate-900 mb-12 font-sans">
            {t.headers.faq}
          </h2>
          <div className="space-y-6">
            {faqs.map((faq, i) => (
              <div key={i} className="bg-white p-6 rounded-2xl border border-slate-205">
                <h4 className="text-sm font-bold text-slate-900 mb-2">{faq.q}</h4>
                <p className="text-slate-550 text-xs leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. MEDICAL DISCLAIMER BANNER */}
      <section className="bg-red-50 py-8 px-6 text-center border-y border-red-100">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center gap-4 justify-center">
          <ShieldAlert className="w-8 h-8 text-red-600 shrink-0" />
          <p className="text-xs text-red-700 font-medium text-left leading-relaxed">
            <strong>{t.headers.disclaimerTitle}</strong> {t.headers.disclaimerText}
          </p>
        </div>
      </section>

      {/* 8. FOOTER */}
      <footer className="bg-slate-900 text-slate-400 py-12 px-6 text-xs text-center border-t border-slate-800">
        <p className="mb-4">© 2026 AI Health Assistant Inc. All rights reserved.</p>
        <div className="flex justify-center gap-6 mb-4 flex-wrap">
          <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-white transition-colors">Clinical Guidelines</a>
          <a href="#" className="hover:text-white transition-colors">Google Maps Terms</a>
          <a href="#" className="hover:text-white transition-colors">Gemini API Compliance</a>
        </div>
        <p className="text-[10px] text-slate-500">Coaligned with global clinical classification standards and HIPAA data directives.</p>
      </footer>
    </div>
  );
}
