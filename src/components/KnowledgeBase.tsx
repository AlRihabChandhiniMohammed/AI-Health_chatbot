/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  BookOpen, ShieldAlert, Cpu, HeartPulse, Activity, Search, 
  ChevronRight, BrainCircuit, Apple, UserCheck, Flame, Loader2 
} from "lucide-react";
import { MedicalMarkdownRenderer } from "./ChatView";

interface CategoryMeta {
  key: string;
  title: string;
  desc: string;
  icon: React.ReactNode;
  bgGrad: string;
}

export default function KnowledgeBase({ selectedLanguage = "en" }: { selectedLanguage?: 'en' | 'hi' | 'te' }) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [knowledgeResult, setKnowledgeResult] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const labels: Record<string, any> = {
    en: {
      title: "Medical Knowledge & Encyclopedia Base",
      subtitle: "Explore certified clinical conditions and lifestyle strategies generated dynamically by AI algorithms.",
      searchPlaceholder: "Search category indices (e.g. Asthma, Hyper...)",
      btnBack: "← Back to Categories Index",
      loading: "Compiling certified medical encyclopedia references...",
      warningTitle: "MEDICAL HEALTH COMPLIANCE DISCLOSURE:",
      warningText: "The compiled references are retrieved purely from generative health datasets for educational scoping purposes. Never swap standard clinical procedures or prescriptions verified by your physician with any metrics shown.",
      retrieveLabel: "Retrieve Factsheet",
      categoryTitle: "CATEGORY",
    },
    hi: {
      title: "चिकित्सा ज्ञान और विश्वकोश केंद्र",
      subtitle: "एआई एल्गोरिदम द्वारा गतिशील रूप से उत्पन्न प्रमाणित नैदानिक स्थितियों और जीवनशैली रणनीतियों का अन्वेषण करें।",
      searchPlaceholder: "श्रेणी सूची खोजें (जैसे- अस्थमा, हाइपर...)",
      btnBack: "← श्रेणियाँ सूची पर वापस जाएँ",
      loading: "प्रमाणित चिकित्सा विश्वकोश संदर्भों को संकलित किया जा रहा है...",
      warningTitle: "चिकित्सा स्वास्थ्य अनुपालन प्रकटीकरण:",
      warningText: "संकलित संदर्भ विशुद्ध रूप से शैक्षिक दायरे के उद्देश्यों के लिए जेनरेटिव स्वास्थ्य डेटासेट से प्राप्त किए गए हैं। अपने चिकित्सक द्वारा सत्यापित मानक नैदानिक प्रक्रियाओं या नुस्खे को कभी भी दिखाए गए किसी भी मीट्रिक से न बदलें।",
      retrieveLabel: "तथ्यपत्र पुनः प्राप्त करें",
      categoryTitle: "श्रेणी",
    },
    te: {
      title: "వైద్య సమాచార విజ్ఞాన కోశం",
      subtitle: "AI అల్గారిథమ్‌ల ద్వారా రూపొందించబడిన ధృవీకరించబడిన క్లినికల్ పరిస్థితులు మరియు జీవనశైలి వ్యూహాలను అన్వేషించండి.",
      searchPlaceholder: "విభాగాలను వెతకండి (ఉదా. అస్త్మా, హైపర్...)",
      btnBack: "← తిరిగి జాబితాకు వెళ్ళండి",
      loading: "ధృవీకరించబడిన వైద్య సూచనలను సేకరిస్తోంది...",
      warningTitle: "వైద్య ఆరోగ్య నిబంధనల వెల్లడి:",
      warningText: "సేకరించిన సమాచారం కేవలం విద్యా ప్రయోజనాల కోసం మాత్రమే రూపొందించబడింది. మీ వైద్యుడు సిఫార్సు చేసిన చికిత్సలు లేదా ప్రిస్క్రిప్షన్‌లకు బదులుగా వీటిని ఉపయోగించవద్దు.",
      retrieveLabel: "వివరాలు పొందండి",
      categoryTitle: "భాగము",
    }
  };

  const categoryTrans: Record<string, Record<string, { title: string; desc: string }>> = {
    en: {
      "Diabetes": {
        title: "Diabetes Management",
        desc: "Investigate clinical blood glucose ranges, insulin sensitivity factors, and dietary carbs planning."
      },
      "Heart Disease": {
        title: "Heart Disease (Cardio)",
        desc: "Analyze coronary plaques risks, cholesterol ratios, clinical arrhythmias, and lifestyle warnings."
      },
      "Hypertension": {
        title: "Hypertension (BP)",
        desc: "Review systolic and diastolic blood pressure brackets and non-pharmacologic lifestyle remedies."
      },
      "Asthma": {
        title: "Asthma & Pulmonary",
        desc: "Learn about aerosol bronchodilators, allergen triggers, pulmonary volumes, and breathing controls."
      },
      "Mental Health": {
        title: "Mental Wellbeing",
        desc: "Understand cognitive behavioral markers, anxiety relief practices, and sleep-cycle restoration."
      },
      "Nutrition": {
        title: "Preventive Nutrition",
        desc: "Analyze clinical micro-nutrients intake guidelines, anti-inflammatory wholefoods, and hydration."
      },
      "Women's Health": {
        title: "Women's Health",
        desc: "Review bone mineral dense protocols, hormonal support phases, and screening milestones."
      },
      "Child Health": {
        title: "Pediatric Care",
        desc: "Inspect pediatric growth percentiles, vaccine scheduling logs, and childhood immunity factors."
      }
    },
    hi: {
      "Diabetes": {
        title: "मधुमेह प्रबंधन",
        desc: "नैदानिक रक्त शर्करा स्तर, इंसुलिन संवेदनशीलता कारकों और आहार नियोजन की जांच करें।"
      },
      "Heart Disease": {
        title: "हृदय रोग (कार्डियो)",
        desc: "कोरोनरी प्लाक जोखिम, कोलेस्ट्रॉल अनुपात, नैदानिक अतालता और जीवनशैली चेतावनियों का विश्लेषण करें।"
      },
      "Hypertension": {
        title: "उच्च रक्तचाप (बीपी)",
        desc: "सिस्टोलिक और डायस्टोलिक रक्तचाप श्रेणियों और गैर-औषधीय जीवनशैली उपचारों की समीक्षा करें।"
      },
      "Asthma": {
        title: "अस्थमा और फुफ्फुसीय",
        desc: "एरोसोल ब्रोन्कोडायलेटर्स, एलर्जेन ट्रिगर, फुफ्फुसीय मात्रा और श्वास नियंत्रण के बारे में जानें।"
      },
      "Mental Health": {
        title: "मानसिक कल्याण",
        desc: "संज्ञानात्मक व्यवहार मार्कर, चिंता राहत प्रथाओं और नींद-चक्र बहाली को समझें।"
      },
      "Nutrition": {
        title: "निवारक पोषण",
        desc: "नैदानिक सूक्ष्म पोषक तत्व दिशानिर्देश, विरोधी भड़काऊ खाद्य पदार्थ और जलयोजन का विश्लेषण करें।"
      },
      "Women's Health": {
        title: "महिला स्वास्थ्य",
        desc: "हड्डी खनिज घनत्व प्रोटोकॉल, हार्मोनल समर्थन चरणों और स्क्रीनिंग मील के पत्थर की समीक्षा करें।"
      },
      "Child Health": {
        title: "बाल रोग देखभाल",
        desc: "बाल चिकित्सा विकास प्रतिशतक, वैक्सीन शेड्यूलिंग लॉग और बचपन की प्रतिरक्षा कारकों का निरीक्षण करें।"
      }
    },
    te: {
      "Diabetes": {
        title: "మధుమేహం నిర్వహణ",
        desc: "రక్తంలో గ్లూకోజ్ స్థాయిలు, ఇన్సులిన్ సున్నితత్వం మరియు ఆహార ప్రణాళికను పరిశీలించండి."
      },
      "Heart Disease": {
        title: "గుండె జబ్బులు (కార్డియో)",
        desc: "కొరోనరీ ప్లాక్స్ ప్రమాదం, కొలెస్ట్రాల్ నిష్పత్తులు మరియు జీవనశైలి హెచ్చరికలను విశ్లేషించండి."
      },
      "Hypertension": {
        title: "రక్తపోటు (బీపీ)",
        desc: "సిస్టోలిక్ మరియు డయాస్టోలిక్ రక్తపోటు బ్రాకెట్లు మరియు సహజ నివారణలను సమీక్షించండి."
      },
      "Asthma": {
        title: "ఆస్తమా & ఊపిరితిత్తులు",
        desc: "ఏరోసోల్ బ్రోంకోడైలేటర్స్, అలెర్జీ ట్రిగ్గర్స్ మరియు శ్వాస నియంత్రణల గురించి తెలుసుకోండి."
      },
      "Mental Health": {
        title: "మానసిక ఆరోగ్యం",
        desc: "ఆందోళన నివారణ పద్ధతులు మరియు నిద్ర చక్రం పునరుద్ధరణను అర్థం చేసుకోండి."
      },
      "Nutrition": {
        title: "నివారణ పోషకాహారం",
        desc: "సూక్ష్మ పోషకాల వినియోగం, వాపు నిరోధక ఆహారాలు మరియు హైడ్రేషన్ గురించి విశ్లేషించండి."
      },
      "Women's Health": {
        title: "మహిళల ఆరోగ్యం",
        desc: "ఎముకల బలం, హార్మోన్ల మార్పులు మరియు స్క్రీనింగ్ మైలురాళ్లను సమీక్షించండి."
      },
      "Child Health": {
        title: "పిల్లల సంరక్షణ",
        desc: "పిల్లల ఎదుగుదల శాతం, టీకాల షెడ్యూల్ మరియు రోగనిరోధక శక్తిని తనిఖీ చేయండి."
      }
    }
  };

  const currentLabels = labels[selectedLanguage] || labels.en;
  const currentTrans = categoryTrans[selectedLanguage] || categoryTrans.en;

  const categories: CategoryMeta[] = [
    {
      key: "Diabetes",
      title: currentTrans["Diabetes"]?.title || "Diabetes Management",
      desc: currentTrans["Diabetes"]?.desc || "Investigate clinical blood glucose ranges, insulin sensitivity factors, and dietary carbs planning.",
      icon: <Activity className="w-5 h-5 text-indigo-500" />,
      bgGrad: "from-indigo-50 to-indigo-100"
    },
    {
      key: "Heart Disease",
      title: currentTrans["Heart Disease"]?.title || "Heart Disease (Cardio)",
      desc: currentTrans["Heart Disease"]?.desc || "Analyze coronary plaques risks, cholesterol ratios, clinical arrhythmias, and lifestyle warnings.",
      icon: <HeartPulse className="w-5 h-5 text-red-500" />,
      bgGrad: "from-red-50 to-red-100"
    },
    {
      key: "Hypertension",
      title: currentTrans["Hypertension"]?.title || "Hypertension (BP)",
      desc: currentTrans["Hypertension"]?.desc || "Review systolic and diastolic blood pressure brackets and non-pharmacologic lifestyle remedies.",
      icon: <Flame className="w-5 h-5 text-amber-500" />,
      bgGrad: "from-amber-50 to-amber-100"
    },
    {
      key: "Asthma",
      title: currentTrans["Asthma"]?.title || "Asthma & Pulmonary",
      desc: currentTrans["Asthma"]?.desc || "Learn about aerosol bronchodilators, allergen triggers, pulmonary volumes, and breathing controls.",
      icon: <Activity className="w-5 h-5 text-sky-500" />,
      bgGrad: "from-sky-50 to-sky-100"
    },
    {
      key: "Mental Health",
      title: currentTrans["Mental Health"]?.title || "Mental Wellbeing",
      desc: currentTrans["Mental Health"]?.desc || "Understand cognitive behavioral markers, anxiety relief practices, and sleep-cycle restoration.",
      icon: <BrainCircuit className="w-5 h-5 text-pink-500" />,
      bgGrad: "from-pink-50 to-pink-100"
    },
    {
      key: "Nutrition",
      title: currentTrans["Nutrition"]?.title || "Preventive Nutrition",
      desc: currentTrans["Nutrition"]?.desc || "Analyze clinical micro-nutrients intake guidelines, anti-inflammatory wholefoods, and hydration.",
      icon: <Apple className="w-5 h-5 text-emerald-500" />,
      bgGrad: "from-emerald-50 to-emerald-100"
    },
    {
      key: "Women's Health",
      title: currentTrans["Women's Health"]?.title || "Women's Health",
      desc: currentTrans["Women's Health"]?.desc || "Review bone mineral dense protocols, hormonal support phases, and screening milestones.",
      icon: <UserCheck className="w-5 h-5 text-purple-500" />,
      bgGrad: "from-purple-50 to-purple-100"
    },
    {
      key: "Child Health",
      title: currentTrans["Child Health"]?.title || "Pediatric Care",
      desc: currentTrans["Child Health"]?.desc || "Inspect pediatric growth percentiles, vaccine scheduling logs, and childhood immunity factors.",
      icon: <ChevronRight className="w-5 h-5 text-teal-500" />,
      bgGrad: "from-teal-50 to-teal-100"
    }
  ];

  const handleFetchKnowledge = async (cat: string) => {
    setSelectedCategory(cat);
    setIsLoading(true);
    setKnowledgeResult(null);

    try {
      const response = await fetch("/api/knowledge-base", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category: cat, language: selectedLanguage })
      });

      const data = await response.json();
      if (!data.results) {
        throw new Error("No encyclopedia results returned from clinical backend");
      }
      setKnowledgeResult(data.results);
    } catch (err) {
      console.error("Failed to compile factsheet: ", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    setSelectedCategory(null);
    setKnowledgeResult(null);
  };

  // Filter categories by user search criteria
  const filteredCategories = categories.filter(c => 
    c.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.desc.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto py-8 px-6 hover:no-underline font-sans">
      {/* 1. SECTOR OVERVIEW */}
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl border border-indigo-100 shadow-sm">
          <BookOpen className="w-6 h-6 shrink-0" />
        </div>
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 border-none m-0">{currentLabels.title}</h2>
          <p className="text-sm text-slate-500 mt-0.5">{currentLabels.subtitle}</p>
        </div>
      </div>

      {!selectedCategory ? (
        // 2. SEARCH & LIST GRAPHIC LAYOUT
        <div className="space-y-6">
          <div className="relative">
            <Search className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={currentLabels.searchPlaceholder}
              className="w-full pl-12 pr-4 py-3.5 bg-white border border-slate-205 rounded-xl outline-none focus:border-indigo-500 text-sm transition-all focus:shadow-sm"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredCategories.map((cat) => (
              <div
                key={cat.key}
                onClick={() => handleFetchKnowledge(cat.key)}
                className="bg-white border border-slate-100 hover:border-indigo-200 rounded-2xl p-6 transition-all hover:shadow-md cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  <div className={`p-2.5 rounded-xl bg-gradient-to-tr ${cat.bgGrad} inline-block mb-4`}>
                    {cat.icon}
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 mb-2 group-hover:text-indigo-600 transition-colors">
                    {cat.title}
                  </h4>
                  <p className="text-slate-500 text-xs leading-relaxed">
                    {cat.desc}
                  </p>
                </div>
                
                <div className="mt-5 pt-3 border-t border-slate-50 flex items-center justify-between text-indigo-600 text-[11px] font-bold">
                  <span>{currentLabels.retrieveLabel}</span>
                  <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        // 3. FACTSHEET DETAIL DISPLAY CONTAINER
        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <button
              onClick={handleBack}
              className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer border-none bg-none"
            >
              {currentLabels.btnBack}
            </button>
            <span className="px-3 py-1 bg-indigo-50 rounded-lg font-bold text-[10px] text-indigo-700 tracking-wider">
              {currentLabels.categoryTitle}: {selectedCategory.toUpperCase()}
            </span>
          </div>

          {isLoading ? (
            <div className="py-20 text-center flex flex-col items-center justify-center space-y-4">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
              <p className="text-xs text-slate-500 animate-pulse">{currentLabels.loading}</p>
            </div>
          ) : (
            <div className="prose max-w-none text-slate-800">
              <MedicalMarkdownRenderer text={knowledgeResult || ""} />
            </div>
          )}

          {/* safety warning footer inside details */}
          <div className="p-4 bg-red-50 border border-red-105 rounded-xl text-[10px] text-red-800 flex gap-3 leading-relaxed">
            <ShieldAlert className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <p>
              <strong>{currentLabels.warningTitle}</strong> {currentLabels.warningText}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
