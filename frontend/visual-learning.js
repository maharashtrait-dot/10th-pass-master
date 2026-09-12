// ============================================================
// 10th PASS MASTER - VISUAL LEARNING SYSTEM (V4)
// Automatic, content-based visual selection for weak learners.
// Uses only the app's internal black-and-white SVG library.
// IMPORTANT: chapter names are never used as visual triggers.
// ============================================================
(function () {
    "use strict";

    const BASE = "assets/visuals/";

    // Each visual has highly specific trigger phrases.  The engine scores
    // matches in Question > Keywords > Easy Answer so a chapter cannot force
    // the same picture onto every question.
    const VISUAL_RULES = [
        // Geography
        { asset: "geo-field-visit.svg", title: "Field Visit", caption: "Observe → locate → record", terms: ["field visit", "क्षेत्रभेट", "field study"] },
        { asset: "geo-location-grid.svg", title: "Location & Extent", caption: "Use direction, latitude and longitude", terms: ["location and extent", "latitude", "longitude", "latitudes", "longitudes"] },
        { asset: "geo-river-mountain.svg", title: "Physiography & Drainage", caption: "Mountains, plateaus and rivers", terms: ["physiography", "drainage", "river system", "river", "mountain", "plateau"] },
        { asset: "geo-weather.svg", title: "Weather", caption: "Short-term condition of the atmosphere", terms: ["what is weather", "weather", "atmospheric condition", "short-term condition"] },
        { asset: "geo-monsoon.svg", title: "Climate & Monsoon", caption: "Monsoon winds bring seasonal rainfall", terms: ["what is climate", "climate", "monsoon", "rainfall", "temperature", "seasonal rainfall"] },
        { asset: "geo-vegetation.svg", title: "Natural Vegetation & Wildlife", caption: "Vegetation and wildlife vary with environment", terms: ["natural vegetation", "wildlife", "forest", "vegetation", "forest type"] },
        { asset: "geo-population.svg", title: "Population", caption: "Population and density can be compared with charts", terms: ["population", "population density", "density", "migration", "census"] },
        { asset: "geo-settlement.svg", title: "Human Settlement", caption: "Rural and urban settlements", terms: ["human settlement", "settlement", "urban settlement", "rural settlement", "urban", "rural"] },
        { asset: "geo-economy.svg", title: "Economy & Occupation", caption: "Primary → Secondary → Tertiary activities", terms: ["economy", "occupation", "primary sector", "secondary sector", "tertiary sector"] },
        { asset: "geo-tourism.svg", title: "Tourism", caption: "Destination, route and tourist attraction", terms: ["tourism", "tourist", "tourist attraction", "heritage site"] },
        { asset: "geo-transport.svg", title: "Transport & Communication", caption: "Connected transport and communication network", terms: ["transport", "communication", "road transport", "railway", "rail", "network"] },

        // Mathematics
        { asset: "math-probability.svg", title: "Probability", caption: "Outcomes and sample space — think of a die", terms: ["probability", "sample space", "outcome", "die", "dice"] },
        { asset: "math-linear-graph.svg", title: "Linear Equation", caption: "Two variables can form a straight-line graph", terms: ["linear equation", "linear equations", "two variables", "straight line", "coordinate graph"] },
        { asset: "math-pythagoras.svg", title: "Pythagoras Theorem", caption: "In a right triangle: hypotenuse² = side² + side²", terms: ["pythagoras", "right angled triangle", "right triangle", "hypotenuse"] },
        { asset: "math-circle.svg", title: "Circle", caption: "Centre, radius, diameter and chord", terms: ["circle", "radius", "diameter", "chord"] },
        { asset: "math-trigonometry.svg", title: "Trigonometry", caption: "Sine, cosine and tangent in a right triangle", terms: ["trigonometry", "sine", "cosine", "tangent"] },

        // Science I
        { asset: "sci-gravitation.svg", title: "Gravitation", caption: "Objects are attracted towards Earth", terms: ["gravitation", "gravity", "gravitational force"] },
        { asset: "sci-periodic-table.svg", title: "Periodic Classification", caption: "Elements are arranged in periods and groups", terms: ["periodic classification", "periodic table", "elements", "group", "period"] },
        { asset: "sci-reaction.svg", title: "Chemical Reaction", caption: "Reactants change into products", terms: ["chemical reaction", "reactant", "reactants", "product", "products", "chemical equation"] },
        { asset: "sci-circuit.svg", title: "Electric Current", caption: "A closed circuit allows current to flow", terms: ["electric current", "electric circuit", "circuit", "voltage", "resistance"] },
        { asset: "sci-heat.svg", title: "Heat", caption: "Heat moves from hotter to colder regions", terms: ["heat", "conduction", "convection", "radiation"] },
        { asset: "sci-refraction.svg", title: "Refraction", caption: "Light bends when it enters another medium", terms: ["refraction", "refractive", "refractive index"] },
        { asset: "sci-lens.svg", title: "Lens", caption: "Light rays converge or diverge through a lens", terms: ["lens", "convex lens", "concave lens", "focus", "focal length"] },
        { asset: "sci-carbon.svg", title: "Carbon Compounds", caption: "Carbon forms chains and many compounds", terms: ["carbon compound", "carbon compounds", "carbon", "hydrocarbon"] },
        { asset: "sci-space.svg", title: "Space Mission", caption: "Earth, orbit and satellite", terms: ["space mission", "satellite", "orbit", "rocket"] },

        // Science II
        { asset: "bio-dna.svg", title: "Heredity & Evolution", caption: "DNA and genes carry hereditary information", terms: ["heredity", "dna", "gene", "genes", "chromosome", "evolution"] },
        { asset: "bio-cell.svg", title: "Cell", caption: "Nucleus and cytoplasm form key parts of a cell", terms: ["cell", "cell biology", "nucleus", "cytoplasm"] },
        { asset: "bio-heart.svg", title: "Life Process — Circulation", caption: "Heart and blood circulation", terms: ["heart", "blood circulation", "circulation"] },
        { asset: "bio-food-chain.svg", title: "Food Chain", caption: "Energy passes from producer to consumers", terms: ["food chain", "ecosystem", "producer", "consumer", "consumers"] },
        { asset: "bio-microbe.svg", title: "Microbiology", caption: "Microorganisms seen at microscopic scale", terms: ["microbiology", "microorganism", "microorganisms", "bacteria", "virus"] },
        { asset: "bio-green-energy.svg", title: "Green Energy", caption: "Renewable energy such as solar power", terms: ["green energy", "solar energy", "renewable energy"] },
        { asset: "bio-disaster.svg", title: "Disaster Management", caption: "Warning → response → safety", terms: ["disaster management", "disaster", "emergency", "hazard"] },

        // History / Civics / Language
        { asset: "history-timeline.svg", title: "History Timeline", caption: "Remember events in chronological sequence", terms: ["historiography", "timeline", "historical event", "movement", "century", "chronology"] },
        { asset: "civics-democracy.svg", title: "Democracy & Elections", caption: "People → vote → representatives", terms: ["democracy", "election", "electoral", "political party", "constitution", "voting"] },
        { asset: "language-keywords.svg", title: "Keyword Memory", caption: "Connect key words with the answer", terms: ["keyword", "keywords", "central idea", "theme", "summary"] },
        { asset: "geo-rainfall-chart.svg", title: "Rainfall Pattern", caption: "Compare rainfall across months with a simple graph", terms: ["rainfall pattern", "rainfall graph", "rainfall distribution", "annual rainfall", "rainfall variation", "पाऊस", "वर्षाव"] },
        { asset: "geo-agriculture.svg", title: "Agriculture", caption: "Farming depends on soil, water and climate", terms: ["agriculture", "farming", "crop", "crops", "cultivation", "शेती", "कृषी"] },
        { asset: "geo-irrigation.svg", title: "Irrigation", caption: "Water is supplied to crops through irrigation", terms: ["irrigation", "irrigated", "canal", "reservoir", "सिंचन"] },
        { asset: "geo-minerals.svg", title: "Mineral Resources", caption: "Minerals occur in different resource regions", terms: ["mineral", "minerals", "mineral resource", "coal", "iron ore", "petroleum", "खनिज"] },
        { asset: "geo-industry.svg", title: "Industry", caption: "Raw material is processed into useful products", terms: ["industry", "industries", "industrial", "manufacturing", "factory", "उद्योग"] },
        { asset: "geo-urbanization.svg", title: "Urbanization", caption: "Urban areas grow as population and activities concentrate", terms: ["urbanization", "urbanisation", "urban growth", "city", "cities", "नागरीकरण"] },
        { asset: "geo-migration.svg", title: "Migration", caption: "People move from an origin to a destination", terms: ["migration", "migrant", "migrants", "push factor", "pull factor", "स्थलांतर"] },
        { asset: "geo-population-pyramid.svg", title: "Population Pyramid", caption: "Age and sex composition can be shown as a pyramid", terms: ["population pyramid", "age composition", "age-sex", "sex composition", "population structure"] },
        { asset: "math-quadratic.svg", title: "Quadratic Equation", caption: "A quadratic relation can form a parabola", terms: ["quadratic equation", "quadratic equations", "roots of quadratic", "parabola"] },
        { asset: "math-ap.svg", title: "Arithmetic Progression", caption: "Terms change by a common difference", terms: ["arithmetic progression", "arithmetic progressions", "common difference", "nth term", "sequence"] },
        { asset: "math-financial.svg", title: "Financial Planning", caption: "Principal, rate, time and interest are connected", terms: ["financial planning", "simple interest", "compound interest", "principal", "rate", "interest"] },
        { asset: "math-statistics.svg", title: "Statistics", caption: "Data can be compared using a bar graph", terms: ["statistics", "mean", "median", "mode", "bar graph", "frequency"] },
        { asset: "math-similarity.svg", title: "Similarity", caption: "Similar figures have the same shape", terms: ["similarity", "similar triangles", "similar figures", "corresponding sides"] },
        { asset: "math-coordinate.svg", title: "Coordinate Geometry", caption: "A point is located using x and y coordinates", terms: ["coordinate geometry", "coordinates", "distance formula", "section formula", "midpoint"] },
        { asset: "math-mensuration.svg", title: "Mensuration", caption: "Measure length, area and volume of figures", terms: ["mensuration", "area", "surface area", "volume", "perimeter"] },
        { asset: "math-construction.svg", title: "Geometric Construction", caption: "Compass and ruler help construct accurate figures", terms: ["geometric construction", "construction", "construct a triangle", "bisector", "compass"] },
        { asset: "sci-motion.svg", title: "Motion & Force", caption: "A force can change the motion of an object", terms: ["motion", "force", "acceleration", "newton", "momentum"] },
        { asset: "sci-acids-bases.svg", title: "Acids and Bases", caption: "Acids and bases show different chemical properties", terms: ["acid", "acids", "base", "bases", "ph", "indicator"] },
        { asset: "sci-metallurgy.svg", title: "Metallurgy", caption: "Ore is processed to obtain useful metal", terms: ["metallurgy", "ore", "extraction of metals", "roasting", "reduction"] },
        { asset: "sci-energy.svg", title: "Energy Transformation", caption: "Energy changes from one form to another", terms: ["energy transformation", "energy conversion", "kinetic energy", "potential energy"] },
        { asset: "bio-respiration.svg", title: "Respiration", caption: "Respiration involves exchange and use of gases", terms: ["respiration", "breathing", "gas exchange", "aerobic respiration", "anaerobic respiration"] },
        { asset: "bio-reproduction.svg", title: "Reproduction", caption: "Reproduction produces a new generation", terms: ["reproduction", "sexual reproduction", "asexual reproduction", "fertilization", "reproductive"] },
        { asset: "bio-environment.svg", title: "Environment", caption: "Living organisms interact with air, water, soil and other life", terms: ["environment", "ecosystem", "environmental management", "air", "water pollution", "soil"] },
        { asset: "bio-classification.svg", title: "Animal Classification", caption: "Classification groups organisms by shared characteristics", terms: ["animal classification", "classification", "phylum", "vertebrates", "invertebrates"] },
        { asset: "bio-biotech.svg", title: "Biotechnology", caption: "Biological knowledge can be used to make useful products", terms: ["biotechnology", "genetic engineering", "tissue culture", "biotech"] },
        { asset: "history-printing.svg", title: "Printing & Mass Media", caption: "Printing and media spread information widely", terms: ["printing", "print media", "mass media", "newspaper", "media"] },
        { asset: "history-arts.svg", title: "Indian Arts", caption: "Art forms preserve cultural ideas and traditions", terms: ["indian arts", "arts", "painting", "sculpture", "architecture"] },
        { asset: "history-sports.svg", title: "Sports & History", caption: "Sporting activities can be studied as historical evidence", terms: ["sports and history", "sports", "sport history", "games"] },
        { asset: "history-heritage.svg", title: "Heritage Management", caption: "Protect, conserve and manage cultural heritage", terms: ["heritage management", "heritage", "conservation", "preservation", "monument"] },
        { asset: "civics-constitution.svg", title: "Constitution", caption: "The constitution provides the framework of governance", terms: ["constitution", "constitutional", "fundamental rights", "governance"] },
        { asset: "civics-political-party.svg", title: "Political Parties", caption: "Parties present ideas and participate in elections", terms: ["political parties", "political party", "party system", "manifesto"] },
        { asset: "language-grammar.svg", title: "Grammar Structure", caption: "Words combine to form phrases and sentences", terms: ["grammar", "व्याकरण", "व्याकरणम्", "वाक्य", "sentence", "noun", "verb", "क्रियापद", "नाम"] },
        { asset: "language-alankar.svg", title: "Alankar / Figures of Speech", caption: "Meaning, comparison and effect make language expressive", terms: ["alankar", "alankara", "अलंकार", "अलंकारः", "figure of speech", "simile", "metaphor"] },
        { asset: "language-writing.svg", title: "Writing Format", caption: "A clear response has an opening, body and closing", terms: ["letter writing", "essay", "report writing", "writing skill", "पत्रलेखन", "निबंध", "लेखन"] },
        { asset: "english-reading.svg", title: "Reading Comprehension", caption: "Read carefully, find evidence and answer", terms: ["comprehension", "reading comprehension", "passage", "extract", "evidence"] },
        { asset: "english-poetry.svg", title: "Poetry Theme", caption: "Images and feelings help reveal the poem's theme", terms: ["poem", "poetry", "poetic", "theme of the poem", "imagery", "figure of speech"] },
        { asset: "english-dialogue.svg", title: "Dialogue", caption: "Dialogue shows speakers, turns and ideas", terms: ["dialogue", "conversation", "speaker", "speakers"] },

        // STEP 33 V5 - Expanded concept library
        { asset: "eng-parts-of-speech.svg", title: "Parts of Speech", caption: "noun • pronoun • verb • adjective", terms: ["parts of speech", "noun", "pronoun", "verb", "adjective", "adverb"] },
        { asset: "eng-tenses.svg", title: "Tenses", caption: "past • present • future", terms: ["tense", "tenses", "past tense", "present tense", "future tense"] },
        { asset: "eng-active-passive.svg", title: "Active / Passive Voice", caption: "doer ↔ action", terms: ["active voice", "passive voice", "voice change"] },
        { asset: "eng-direct-indirect.svg", title: "Direct / Indirect Speech", caption: "speaker → reported speech", terms: ["direct speech", "indirect speech", "reported speech", "narration"] },
        { asset: "eng-modals.svg", title: "Modals", caption: "can • could • may • must", terms: ["modal", "modals", "can", "could", "may", "must", "should"] },
        { asset: "eng-clauses.svg", title: "Clauses", caption: "main clause + subordinate clause", terms: ["clause", "clauses", "main clause", "subordinate clause"] },
        { asset: "eng-question-tag.svg", title: "Question Tag", caption: "statement + short question", terms: ["question tag", "question tags", "tag question"] },
        { asset: "eng-email.svg", title: "Email Writing", caption: "to • subject • message", terms: ["email writing", "e-mail", "email", "subject line"] },
        { asset: "eng-speech-writing.svg", title: "Speech Writing", caption: "opening • points • closing", terms: ["speech writing", "speech", "address", "vote of thanks"] },
        { asset: "eng-expansion.svg", title: "Expansion of Idea", caption: "idea → explanation → example", terms: ["expansion of idea", "expand the idea", "idea expansion"] },
        { asset: "eng-summary.svg", title: "Summary", caption: "main points only", terms: ["summary", "summarize", "summarise", "gist", "main points"] },
        { asset: "eng-story.svg", title: "Story Writing", caption: "beginning → middle → ending", terms: ["story writing", "story writing", "story completion", "narrative"] },
        { asset: "lang-synonyms.svg", title: "समानार्थी / पर्यायवाची", caption: "same meaning words", terms: ["समानार्थी", "समानार्थी शब्द", "पर्यायवाची", "पर्यायवाची शब्द"] },
        { asset: "lang-antonyms.svg", title: "विरुद्धार्थी / विलोम", caption: "opposite meaning", terms: ["विरुद्धार्थी", "विरुद्धार्थी शब्द", "विलोम", "विलोम शब्द"] },
        { asset: "lang-idiom.svg", title: "वाक्प्रचार / मुहावरा", caption: "fixed expression → meaning", terms: ["वाक्प्रचार", "वाक्प्रचाराचा अर्थ", "मुहावरा", "मुहावरे", "मुहावरे का अर्थ"] },
        { asset: "lang-proverb.svg", title: "म्हणी / लोकोक्ती", caption: "short saying with a message", terms: ["म्हण", "म्हणी", "लोकोक्ती", "लोकोक्ति", "proverb"] },
        { asset: "lang-kal.svg", title: "काळ / काल", caption: "present • past • future", terms: ["काळ", "वर्तमानकाळ", "भूतकाळ", "भविष्यकाळ", "काल", "वर्तमान काल", "भूत काल", "भविष्य काल"] },
        { asset: "lang-sandhi.svg", title: "संधी / संधि", caption: "words join by sound change", terms: ["संधी", "संधीविच्छेद", "संधि", "संधिविच्छेद"] },
        { asset: "lang-samas.svg", title: "समास", caption: "joined words → compact meaning", terms: ["समास", "समासविग्रह", "समास विग्रह"] },
        { asset: "lang-vibhakti.svg", title: "विभक्ती", caption: "case relation in a sentence", terms: ["विभक्ती", "विभक्ति", "case marker", "कारक"] },
        { asset: "lang-ras.svg", title: "रस", caption: "भावना → काव्य अनुभव", terms: ["रस", "रसाचे प्रकार", "रसाः", "rasa"] },
        { asset: "sanskrit-dhatu.svg", title: "धातुरूप", caption: "root → verb forms", terms: ["धातुरूप", "धातुरूपाणि", "धातु", "verb forms"] },
        { asset: "sanskrit-shabdarup.svg", title: "शब्दरूप", caption: "noun forms by case/number", terms: ["शब्दरूप", "शब्दरूपाणि", "विभक्तयः", "विभक्ति"] },
        { asset: "sanskrit-lakar.svg", title: "लकार", caption: "verb tense/mood forms", terms: ["लकार", "लट्", "लङ्", "लृट्", "लोट्", "विधिलिङ्"] },
        { asset: "math-set.svg", title: "Sets", caption: "union • intersection • elements", terms: ["set", "sets", "union", "intersection", "element of set"] },
        { asset: "math-polynomial.svg", title: "Polynomial", caption: "terms and coefficients", terms: ["polynomial", "polynomials", "coefficient", "degree of polynomial"] },
        { asset: "math-factorization.svg", title: "Factorisation", caption: "expression → factors", terms: ["factorisation", "factorization", "factors", "factorise", "factorize"] },
        { asset: "math-mean.svg", title: "Mean / Average", caption: "sum ÷ number of values", terms: ["mean", "average", "arithmetic mean"] },
        { asset: "math-probability-tree.svg", title: "Probability Tree", caption: "event → outcomes", terms: ["probability tree", "dependent event", "independent event", "event"] },
        { asset: "math-pie-chart.svg", title: "Data Chart", caption: "parts of a whole", terms: ["pie chart", "pie diagram", "data representation"] },
        { asset: "math-slope.svg", title: "Slope", caption: "rise ÷ run", terms: ["slope", "gradient", "rise over run"] },
        { asset: "math-surface.svg", title: "Surface Area", caption: "net → area", terms: ["surface area", "total surface area", "lateral surface area"] },
        { asset: "math-volume.svg", title: "Volume", caption: "base area × height", terms: ["volume", "capacity", "cubic units"] },
        { asset: "sci-laws-motion.svg", title: "Laws of Motion", caption: "force ↔ mass ↔ acceleration", terms: ["laws of motion", "newton laws", "first law", "second law", "third law"] },
        { asset: "sci-work-energy.svg", title: "Work & Energy", caption: "force × displacement", terms: ["work", "work done", "energy", "mechanical energy"] },
        { asset: "sci-electric-power.svg", title: "Electric Power", caption: "V × I and electrical energy", terms: ["electric power", "electrical power", "electric energy", "watt"] },
        { asset: "sci-magnetic.svg", title: "Magnetic Field", caption: "field lines around a magnet", terms: ["magnetic field", "magnetism", "magnetic lines", "electromagnet"] },
        { asset: "sci-periodic-trends.svg", title: "Periodic Trends", caption: "atomic size • valency • metallic character", terms: ["periodic trends", "atomic size", "valency", "metallic character"] },
        { asset: "sci-oxidation.svg", title: "Oxidation / Reduction", caption: "electron transfer", terms: ["oxidation", "reduction", "redox", "oxidising", "reducing"] },
        { asset: "sci-acid-scale.svg", title: "pH Scale", caption: "acid ← 7 → base", terms: ["ph scale", "pH value", "acidic", "basic", "alkaline"] },
        { asset: "sci-reflection.svg", title: "Reflection of Light", caption: "angle of incidence = reflection", terms: ["reflection of light", "law of reflection", "incident ray", "reflected ray"] },
        { asset: "sci-dispersion.svg", title: "Dispersion", caption: "white light → spectrum", terms: ["dispersion", "spectrum", "prism", "white light"] },
        { asset: "sci-eye.svg", title: "Human Eye", caption: "cornea • lens • retina", terms: ["human eye", "retina", "cornea", "iris", "pupil", "accommodation"] },
        { asset: "sci-acids-indicator.svg", title: "Indicators", caption: "colour change reveals pH", terms: ["indicator", "litmus", "universal indicator", "phenolphthalein"] },
        { asset: "bio-digestion.svg", title: "Digestion", caption: "food → nutrients", terms: ["digestion", "digestive system", "enzyme", "small intestine"] },
        { asset: "bio-excretion.svg", title: "Excretion", caption: "kidney → urine", terms: ["excretion", "kidney", "nephron", "urine"] },
        { asset: "bio-nervous.svg", title: "Nervous System", caption: "stimulus → response", terms: ["nervous system", "neuron", "brain", "reflex action", "spinal cord"] },
        { asset: "bio-endocrine.svg", title: "Hormones", caption: "gland → hormone → target", terms: ["hormone", "endocrine", "endocrine gland", "thyroid", "insulin"] },
        { asset: "bio-photosynthesis.svg", title: "Photosynthesis", caption: "light + CO₂ + water → food", terms: ["photosynthesis", "chlorophyll", "carbon dioxide", "glucose", "stomata"] },
        { asset: "bio-ecosystem.svg", title: "Ecosystem", caption: "producer → consumer → decomposer", terms: ["ecosystem", "producer", "consumer", "decomposer", "food web"] },
        { asset: "bio-pollution.svg", title: "Pollution", caption: "source → pollutant → effect", terms: ["pollution", "air pollution", "water pollution", "soil pollution", "pollutant"] },
        { asset: "bio-genetic-cross.svg", title: "Genetic Cross", caption: "parent traits → offspring", terms: ["genetic cross", "punnett square", "dominant", "recessive", "trait"] },
        { asset: "bio-evolution.svg", title: "Evolution", caption: "variation → selection → change", terms: ["evolution", "natural selection", "variation", "adaptation"] },
        { asset: "bio-tissue.svg", title: "Tissue", caption: "cells → tissue → organ", terms: ["tissue", "plant tissue", "animal tissue", "organ"] },
        { asset: "geo-lat-long.svg", title: "Latitude & Longitude", caption: "grid → location", terms: ["latitude", "longitude", "latitudes and longitudes", "prime meridian", "equator"] },
        { asset: "geo-map-scale.svg", title: "Map Scale", caption: "map distance ↔ ground distance", terms: ["map scale", "scale", "representative fraction", "distance on map"] },
        { asset: "geo-contour.svg", title: "Contour Lines", caption: "equal height points", terms: ["contour", "contour lines", "topographic", "elevation"] },
        { asset: "geo-climate-graph.svg", title: "Climate Graph", caption: "temperature + rainfall", terms: ["climograph", "climate graph", "temperature and rainfall", "rainfall graph"] },
        { asset: "geo-soil.svg", title: "Soil", caption: "soil → crop suitability", terms: ["soil", "soil type", "black soil", "alluvial soil", "laterite soil"] },
        { asset: "geo-crop-pattern.svg", title: "Cropping Pattern", caption: "crop regions and seasons", terms: ["cropping pattern", "kharif", "rabi", "crop pattern", "cash crop", "food crop"] },
        { asset: "geo-mining.svg", title: "Mining", caption: "ore → extraction → mineral", terms: ["mining", "mineral extraction", "open cast", "underground mining"] },
        { asset: "geo-trade.svg", title: "Trade", caption: "goods → market → destination", terms: ["trade", "export", "import", "international trade", "market"] },
        { asset: "geo-communication.svg", title: "Communication", caption: "message → medium → receiver", terms: ["communication", "mass communication", "telecommunication", "internet"] },
        { asset: "history-cause-effect.svg", title: "Cause & Effect", caption: "event → causes → consequences", terms: ["cause and effect", "causes", "consequences", "impact", "result"] },
        { asset: "history-source.svg", title: "Historical Sources", caption: "source → evidence → interpretation", terms: ["historical sources", "primary source", "secondary source", "evidence"] },
        { asset: "history-chronology.svg", title: "Chronology", caption: "before → during → after", terms: ["chronology", "chronological order", "sequence of events", "period"] },
        { asset: "history-cultural.svg", title: "Cultural Heritage", caption: "art • architecture • tradition", terms: ["cultural heritage", "culture", "tradition", "heritage"] },
        { asset: "civics-legislature.svg", title: "Legislature", caption: "law-making body", terms: ["legislature", "parliament", "assembly", "law making"] },
        { asset: "civics-executive.svg", title: "Executive", caption: "government → administration", terms: ["executive", "administration", "cabinet", "government"] },
        { asset: "civics-judiciary.svg", title: "Judiciary", caption: "court → justice", terms: ["judiciary", "court", "supreme court", "high court", "justice"] },
        { asset: "civics-rights.svg", title: "Fundamental Rights", caption: "citizen rights protected by constitution", terms: ["fundamental rights", "rights", "right to equality", "right to freedom"] },
        { asset: "civics-election-process.svg", title: "Election Process", caption: "voter → vote → result", terms: ["election process", "voter", "polling", "ballot", "election result"] },
    ];

    registerOverride("What is climate?", "geo-weather.svg", "Weather", "Short-term atmospheric condition");
    registerOverride("What is weather?", "geo-weather.svg", "Weather", "Short-term atmospheric condition");
    registerOverride("Which monsoon is most important for India?", "geo-monsoon.svg", "Climate & Monsoon", "Seasonal winds, temperature and rainfall");
    registerOverride("Name one factor affecting climate.", "geo-location-grid.svg", "Location & Coordinates", "Use the geographic grid to locate places");
    registerOverride("How does altitude affect temperature?", "geo-monsoon.svg", "Climate & Monsoon", "Seasonal winds, temperature and rainfall");
    registerOverride("What is rainfall?", "geo-monsoon.svg", "Climate & Monsoon", "Seasonal winds, temperature and rainfall");
    registerOverride("Why is monsoon important to India?", "geo-monsoon.svg", "Climate & Monsoon", "Seasonal winds, temperature and rainfall");
    registerOverride("What is the retreating monsoon?", "geo-monsoon.svg", "Climate & Monsoon", "Seasonal winds, temperature and rainfall");
    registerOverride("Name one region receiving very high rainfall in India.", "geo-monsoon.svg", "Climate & Monsoon", "Seasonal winds, temperature and rainfall");
    registerOverride("How does climate affect human life?", "geo-monsoon.svg", "Climate & Monsoon", "Seasonal winds, temperature and rainfall");
    registerOverride("What is meant by location?", "geo-location-grid.svg", "Location & Coordinates", "Use the geographic grid to locate places");
    registerOverride("What are the two types of location?", "geo-location-grid.svg", "Location & Coordinates", "Use the geographic grid to locate places");
    registerOverride("Which lines help determine latitude?", "geo-location-grid.svg", "Location & Coordinates", "Use the geographic grid to locate places");
    registerOverride("Which lines help determine longitude?", "geo-location-grid.svg", "Location & Coordinates", "Use the geographic grid to locate places");
    registerOverride("What is extent?", "geo-location-grid.svg", "Location & Coordinates", "Use the geographic grid to locate places");
    registerOverride("Why is latitude important for India?", "geo-location-grid.svg", "Location & Coordinates", "Use the geographic grid to locate places");
    registerOverride("Why is longitude important?", "geo-location-grid.svg", "Location & Coordinates", "Use the geographic grid to locate places");
    registerOverride("What is India’s approximate latitudinal extent?", "geo-location-grid.svg", "Location & Coordinates", "Use the geographic grid to locate places");
    registerOverride("What is India’s approximate longitudinal extent?", "geo-location-grid.svg", "Location & Coordinates", "Use the geographic grid to locate places");
    registerOverride("Why is the Standard Meridian important?", "geo-location-grid.svg", "Location & Coordinates", "Use the geographic grid to locate places");
    registerOverride("What is the main purpose of a field visit in geography?", "geo-field-visit.svg", "Field Study", "Observe, record and verify field data");
    registerOverride("What should be prepared before a field visit?", "geo-field-visit.svg", "Field Study", "Observe, record and verify field data");
    registerOverride("Why is a field diary useful?", "geo-field-visit.svg", "Field Study", "Observe, record and verify field data");
    registerOverride("What is meant by observation in a field study?", "geo-field-visit.svg", "Field Study", "Observe, record and verify field data");
    registerOverride("Why are photographs useful during a field visit?", "geo-field-visit.svg", "Field Study", "Observe, record and verify field data");
    registerOverride("What is a questionnaire?", "geo-field-visit.svg", "Field Study", "Observe, record and verify field data");
    registerOverride("Why is location important in a field study?", "geo-field-visit.svg", "Field Study", "Observe, record and verify field data");
    registerOverride("What is primary data in a field visit?", "geo-field-visit.svg", "Field Study", "Observe, record and verify field data");
    registerOverride("State one safety rule for a field visit.", "geo-field-visit.svg", "Field Study", "Observe, record and verify field data");
    registerOverride("How does a field visit improve geographical learning?", "geo-field-visit.svg", "Field Study", "Observe, record and verify field data");
    registerOverride("What is natural vegetation?", "geo-vegetation.svg", "Vegetation & Wildlife", "Plants, animals and habitats");
    registerOverride("What is wildlife?", "geo-vegetation.svg", "Vegetation & Wildlife", "Plants, animals and habitats");
    registerOverride("Name one type of natural vegetation in India.", "geo-vegetation.svg", "Vegetation & Wildlife", "Plants, animals and habitats");
    registerOverride("Where are thorn forests generally found?", "geo-monsoon.svg", "Climate & Monsoon", "Seasonal winds, temperature and rainfall");
    registerOverride("Why are forests important?", "geo-vegetation.svg", "Vegetation & Wildlife", "Plants, animals and habitats");
    registerOverride("What is biodiversity?", "geo-vegetation.svg", "Vegetation & Wildlife", "Plants, animals and habitats");
    registerOverride("What is a wildlife sanctuary?", "geo-vegetation.svg", "Vegetation & Wildlife", "Plants, animals and habitats");
    registerOverride("What is a national park?", "geo-vegetation.svg", "Vegetation & Wildlife", "Plants, animals and habitats");
    registerOverride("State one cause of wildlife loss.", "geo-vegetation.svg", "Vegetation & Wildlife", "Plants, animals and habitats");
    registerOverride("How can wildlife be conserved?", "geo-vegetation.svg", "Vegetation & Wildlife", "Plants, animals and habitats");
    registerOverride("What is a human settlement?", "geo-settlement.svg", "Human Settlement", "Settlement pattern and urban growth");
    registerOverride("What is a rural settlement?", "geo-settlement.svg", "Human Settlement", "Settlement pattern and urban growth");
    registerOverride("What is an urban settlement?", "geo-population.svg", "Population", "Population size, density and distribution");
    registerOverride("Name one factor influencing settlement location.", "geo-location-grid.svg", "Location & Coordinates", "Use the geographic grid to locate places");
    registerOverride("What is a nucleated settlement?", "geo-settlement.svg", "Human Settlement", "Settlement pattern and urban growth");
    registerOverride("What is a dispersed settlement?", "geo-settlement.svg", "Human Settlement", "Settlement pattern and urban growth");
    registerOverride("Why do settlements develop near rivers?", "geo-settlement.svg", "Human Settlement", "Settlement pattern and urban growth");
    registerOverride("What is urbanisation?", "geo-population.svg", "Population", "Population size, density and distribution");
    registerOverride("State one problem of rapid urbanisation.", "geo-settlement.svg", "Human Settlement", "Settlement pattern and urban growth");
    registerOverride("Why is transport important for settlements?", "geo-settlement.svg", "Human Settlement", "Settlement pattern and urban growth");
    registerOverride("Name the major physiographic divisions of India.", "geo-river-mountain.svg", "Physiography & Drainage", "Relief, rivers and drainage shape the landscape");
    registerOverride("What is drainage?", "geo-river-mountain.svg", "Physiography & Drainage", "Relief, rivers and drainage shape the landscape");
    registerOverride("What is a river basin?", "geo-river-mountain.svg", "Physiography & Drainage", "Relief, rivers and drainage shape the landscape");
    registerOverride("Name one major Himalayan river.", "geo-river-mountain.svg", "Physiography & Drainage", "Relief, rivers and drainage shape the landscape");
    registerOverride("Name one major Peninsular river.", "geo-river-mountain.svg", "Physiography & Drainage", "Relief, rivers and drainage shape the landscape");
    registerOverride("Why are Northern Plains fertile?", "geo-river-mountain.svg", "Physiography & Drainage", "Relief, rivers and drainage shape the landscape");
    registerOverride("What is a tributary?", "geo-river-mountain.svg", "Physiography & Drainage", "Relief, rivers and drainage shape the landscape");
    registerOverride("What is a watershed?", "geo-river-mountain.svg", "Physiography & Drainage", "Relief, rivers and drainage shape the landscape");
    registerOverride("Give one importance of rivers.", "geo-economy.svg", "Economy & Occupation", "Economic activities and livelihoods");
    registerOverride("Why are physiographic divisions important?", "geo-river-mountain.svg", "Physiography & Drainage", "Relief, rivers and drainage shape the landscape");
    registerOverride("What is transport?", "geo-transport.svg", "Transport & Communication", "Movement of people, goods and information");
    registerOverride("Name the main modes of transport.", "geo-transport.svg", "Transport & Communication", "Movement of people, goods and information");
    registerOverride("What is communication?", "geo-transport.svg", "Transport & Communication", "Movement of people, goods and information");
    registerOverride("Why are roadways important?", "geo-transport.svg", "Transport & Communication", "Movement of people, goods and information");
    registerOverride("Why are railways important?", "geo-transport.svg", "Transport & Communication", "Movement of people, goods and information");
    registerOverride("What is the advantage of waterways?", "geo-transport.svg", "Transport & Communication", "Movement of people, goods and information");
    registerOverride("Why are airways useful?", "geo-transport.svg", "Transport & Communication", "Movement of people, goods and information");
    registerOverride("What is mass communication?", "geo-transport.svg", "Transport & Communication", "Movement of people, goods and information");
    registerOverride("How does the internet help communication?", "geo-transport.svg", "Transport & Communication", "Movement of people, goods and information");
    registerOverride("Why are transport and communication called infrastructure?", "geo-economy.svg", "Economy & Occupation", "Economic activities and livelihoods");
    registerOverride("What is population?", "geo-population.svg", "Population", "Population size, density and distribution");
    registerOverride("What is population density?", "geo-population.svg", "Population", "Population size, density and distribution");
    registerOverride("What is population distribution?", "geo-population.svg", "Population", "Population size, density and distribution");
    registerOverride("Name one factor affecting population distribution.", "geo-population.svg", "Population", "Population size, density and distribution");
    registerOverride("Why are fertile plains densely populated?", "geo-settlement.svg", "Human Settlement", "Settlement pattern and urban growth");
    registerOverride("What is birth rate?", "geo-population.svg", "Population", "Population size, density and distribution");
    registerOverride("What is death rate?", "geo-population.svg", "Population", "Population size, density and distribution");
    registerOverride("What is literacy rate?", "geo-population.svg", "Population", "Population size, density and distribution");
    registerOverride("Why is population data useful?", "geo-population.svg", "Population", "Population size, density and distribution");
    registerOverride("What is tourism?", "geo-tourism.svg", "Tourism", "Tourism, destinations and sustainability");
    registerOverride("What is domestic tourism?", "geo-tourism.svg", "Tourism", "Tourism, destinations and sustainability");
    registerOverride("What is international tourism?", "geo-tourism.svg", "Tourism", "Tourism, destinations and sustainability");
    registerOverride("Name one natural tourist attraction in India.", "geo-tourism.svg", "Tourism", "Tourism, destinations and sustainability");
    registerOverride("Name one historical tourist attraction in India.", "geo-tourism.svg", "Tourism", "Tourism, destinations and sustainability");
    registerOverride("How does tourism generate employment?", "geo-tourism.svg", "Tourism", "Tourism, destinations and sustainability");
    registerOverride("What is eco-tourism?", "geo-tourism.svg", "Tourism", "Tourism, destinations and sustainability");
    registerOverride("State one negative effect of uncontrolled tourism.", "geo-tourism.svg", "Tourism", "Tourism, destinations and sustainability");
    registerOverride("Why is tourism important to the economy?", "geo-tourism.svg", "Tourism", "Tourism, destinations and sustainability");
    registerOverride("How can sustainable tourism be promoted?", "geo-tourism.svg", "Tourism", "Tourism, destinations and sustainability");
    registerOverride("What is an occupation?", "geo-economy.svg", "Economy & Occupation", "Economic activities and livelihoods");
    registerOverride("What is a primary occupation?", "geo-economy.svg", "Economy & Occupation", "Economic activities and livelihoods");
    registerOverride("Give one example of a secondary occupation.", "geo-economy.svg", "Economy & Occupation", "Economic activities and livelihoods");
    registerOverride("What is a tertiary occupation?", "geo-economy.svg", "Economy & Occupation", "Economic activities and livelihoods");
    registerOverride("What is agriculture?", "geo-economy.svg", "Economy & Occupation", "Economic activities and livelihoods");
    registerOverride("Why are industries located near raw materials?", "geo-transport.svg", "Transport & Communication", "Movement of people, goods and information");
    registerOverride("What is a market?", "geo-economy.svg", "Economy & Occupation", "Economic activities and livelihoods");
    registerOverride("How does transport support economic activity?", "geo-economy.svg", "Economy & Occupation", "Economic activities and livelihoods");
    registerOverride("Why do occupations vary from region to region?", "geo-monsoon.svg", "Climate & Monsoon", "Seasonal winds, temperature and rainfall");
    registerOverride("A bag contains 6 equally likely outcomes, of which 1 are favourable. Find the probability of a favourable outcome.", "math-probability.svg", "Probability", "Outcomes, sample space and chance");
    registerOverride("A bag contains 7 equally likely outcomes, of which 2 are favourable. Find the probability of a favourable outcome.", "math-probability.svg", "Probability", "Outcomes, sample space and chance");
    registerOverride("A bag contains 8 equally likely outcomes, of which 3 are favourable. Find the probability of a favourable outcome.", "math-probability.svg", "Probability", "Outcomes, sample space and chance");
    registerOverride("A bag contains 9 equally likely outcomes, of which 4 are favourable. Find the probability of a favourable outcome.", "math-probability.svg", "Probability", "Outcomes, sample space and chance");
    registerOverride("A bag contains 10 equally likely outcomes, of which 1 are favourable. Find the probability of a favourable outcome.", "math-probability.svg", "Probability", "Outcomes, sample space and chance");
    registerOverride("A bag contains 11 equally likely outcomes, of which 2 are favourable. Find the probability of a favourable outcome.", "math-probability.svg", "Probability", "Outcomes, sample space and chance");
    registerOverride("A bag contains 12 equally likely outcomes, of which 3 are favourable. Find the probability of a favourable outcome.", "math-probability.svg", "Probability", "Outcomes, sample space and chance");
    registerOverride("A fair die is thrown once. Find the probability of getting a number greater than 1.", "math-probability.svg", "Probability", "Outcomes, sample space and chance");
    registerOverride("A fair die is thrown once. Find the probability of getting a number greater than 2.", "math-probability.svg", "Probability", "Outcomes, sample space and chance");
    registerOverride("A fair die is thrown once. Find the probability of getting a number greater than 3.", "math-probability.svg", "Probability", "Outcomes, sample space and chance");
    registerOverride("A fair die is thrown once. Find the probability of getting a number greater than 4.", "math-probability.svg", "Probability", "Outcomes, sample space and chance");
    registerOverride("A fair die is thrown once. Find the probability of getting a number greater than 5.", "math-probability.svg", "Probability", "Outcomes, sample space and chance");
    registerOverride("A fair die is thrown once. Find the probability of getting a number greater than 6.", "math-probability.svg", "Probability", "Outcomes, sample space and chance");
    registerOverride("A fair die is thrown once. Find the probability of getting a number greater than 7.", "math-probability.svg", "Probability", "Outcomes, sample space and chance");
    registerOverride("A coin is tossed twice. Find the probability of getting exactly one head.", "math-probability.svg", "Probability", "Outcomes, sample space and chance");
    registerOverride("A coin is tossed twice. Find the probability of getting exactly one head.", "math-probability.svg", "Probability", "Outcomes, sample space and chance");
    registerOverride("A coin is tossed twice. Find the probability of getting exactly one head.", "math-probability.svg", "Probability", "Outcomes, sample space and chance");
    registerOverride("A coin is tossed twice. Find the probability of getting exactly one head.", "math-probability.svg", "Probability", "Outcomes, sample space and chance");
    registerOverride("A coin is tossed twice. Find the probability of getting exactly one head.", "math-probability.svg", "Probability", "Outcomes, sample space and chance");
    registerOverride("A coin is tossed twice. Find the probability of getting exactly one head.", "math-probability.svg", "Probability", "Outcomes, sample space and chance");
    registerOverride("Find the 5th term of the arithmetic progression 2, 4, 6, ...", "math-ap.svg", "Arithmetic Progression", "Terms follow a common difference");
    registerOverride("Find the 6th term of the arithmetic progression 3, 6, 9, ...", "math-ap.svg", "Arithmetic Progression", "Terms follow a common difference");
    registerOverride("Find the 7th term of the arithmetic progression 4, 8, 12, ...", "math-ap.svg", "Arithmetic Progression", "Terms follow a common difference");
    registerOverride("Find the 8th term of the arithmetic progression 5, 10, 15, ...", "math-ap.svg", "Arithmetic Progression", "Terms follow a common difference");
    registerOverride("Find the 9th term of the arithmetic progression 6, 12, 18, ...", "math-ap.svg", "Arithmetic Progression", "Terms follow a common difference");
    registerOverride("Find the 10th term of the arithmetic progression 7, 9, 11, ...", "math-ap.svg", "Arithmetic Progression", "Terms follow a common difference");
    registerOverride("Find the 5th term of the arithmetic progression 8, 11, 14, ...", "math-ap.svg", "Arithmetic Progression", "Terms follow a common difference");
    registerOverride("Find the 6th term of the arithmetic progression 9, 13, 17, ...", "math-ap.svg", "Arithmetic Progression", "Terms follow a common difference");
    registerOverride("Find the 7th term of the arithmetic progression 10, 15, 20, ...", "math-ap.svg", "Arithmetic Progression", "Terms follow a common difference");
    registerOverride("Find the 8th term of the arithmetic progression 11, 17, 23, ...", "math-ap.svg", "Arithmetic Progression", "Terms follow a common difference");
    registerOverride("Find the sum of the first 9 terms of the A.P. 12, 14, 16, ...", "math-ap.svg", "Arithmetic Progression", "Terms follow a common difference");
    registerOverride("Find the sum of the first 10 terms of the A.P. 13, 16, 19, ...", "math-ap.svg", "Arithmetic Progression", "Terms follow a common difference");
    registerOverride("Find the sum of the first 5 terms of the A.P. 14, 18, 22, ...", "math-ap.svg", "Arithmetic Progression", "Terms follow a common difference");
    registerOverride("Find the sum of the first 6 terms of the A.P. 15, 20, 25, ...", "math-ap.svg", "Arithmetic Progression", "Terms follow a common difference");
    registerOverride("Find the sum of the first 7 terms of the A.P. 16, 22, 28, ...", "math-ap.svg", "Arithmetic Progression", "Terms follow a common difference");
    registerOverride("Find the sum of the first 8 terms of the A.P. 17, 19, 21, ...", "math-ap.svg", "Arithmetic Progression", "Terms follow a common difference");
    registerOverride("Find the sum of the first 9 terms of the A.P. 18, 21, 24, ...", "math-ap.svg", "Arithmetic Progression", "Terms follow a common difference");
    registerOverride("Find the sum of the first 10 terms of the A.P. 19, 23, 27, ...", "math-ap.svg", "Arithmetic Progression", "Terms follow a common difference");
    registerOverride("Find the sum of the first 5 terms of the A.P. 20, 25, 30, ...", "math-ap.svg", "Arithmetic Progression", "Terms follow a common difference");
    registerOverride("Find the sum of the first 6 terms of the A.P. 21, 27, 33, ...", "math-ap.svg", "Arithmetic Progression", "Terms follow a common difference");
    registerOverride("Solve the pair of linear equations: 2x + 3y = 13 and 1x + 1y = 5.", "math-linear-graph.svg", "Linear Equations", "Two variables represented on a straight-line graph");
    registerOverride("Solve the pair of linear equations: 3x + 2y = 16 and 1x + 2y = 4.", "math-linear-graph.svg", "Linear Equations", "Two variables represented on a straight-line graph");
    registerOverride("Solve the pair of linear equations: 4x + 1y = 17 and 2x + 1y = 3.", "math-linear-graph.svg", "Linear Equations", "Two variables represented on a straight-line graph");
    registerOverride("Solve the pair of linear equations: 5x + 2y = 24 and 1x + 1y = 2.", "math-linear-graph.svg", "Linear Equations", "Two variables represented on a straight-line graph");
    registerOverride("Solve the pair of linear equations: 2x + 5y = 19 and 1x + 3y = 1.", "math-linear-graph.svg", "Linear Equations", "Two variables represented on a straight-line graph");
    registerOverride("Solve the pair of linear equations: 3x + 4y = 25 and 2x + 1y = 5.", "math-linear-graph.svg", "Linear Equations", "Two variables represented on a straight-line graph");
    registerOverride("Solve the pair of linear equations: 6x + 1y = 19 and 1x + 2y = 2.", "math-linear-graph.svg", "Linear Equations", "Two variables represented on a straight-line graph");
    registerOverride("Solve the pair of linear equations: 2x + 7y = 23 and 3x + 1y = 4.", "math-linear-graph.svg", "Linear Equations", "Two variables represented on a straight-line graph");
    registerOverride("Solve the pair of linear equations: 4x + 3y = 29 and 1x + 2y = 3.", "math-linear-graph.svg", "Linear Equations", "Two variables represented on a straight-line graph");
    registerOverride("Solve the pair of linear equations: 5x + 1y = 21 and 2x + 1y = 2.", "math-linear-graph.svg", "Linear Equations", "Two variables represented on a straight-line graph");
    registerOverride("Find the value of y when x = 1 in the equation 2x + y = 10.", "math-linear-graph.svg", "Linear Equations", "Two variables represented on a straight-line graph");
    registerOverride("Check whether (2, 3) satisfies 2x + 3y = 11.", "math-linear-graph.svg", "Linear Equations", "Two variables represented on a straight-line graph");
    registerOverride("Write the equation represented by: x + y = 12 and x - y = 4.", "math-linear-graph.svg", "Linear Equations", "Two variables represented on a straight-line graph");
    registerOverride("Find the value of y when x = 4 in the equation 5x + y = 19.", "math-linear-graph.svg", "Linear Equations", "Two variables represented on a straight-line graph");
    registerOverride("Check whether (5, 6) satisfies 5x + 6y = 41.", "math-linear-graph.svg", "Linear Equations", "Two variables represented on a straight-line graph");
    registerOverride("Write the equation represented by: x + y = 15 and x - y = 7.", "math-linear-graph.svg", "Linear Equations", "Two variables represented on a straight-line graph");
    registerOverride("Find the value of y when x = 7 in the equation 8x + y = 28.", "math-linear-graph.svg", "Linear Equations", "Two variables represented on a straight-line graph");
    registerOverride("Check whether (8, 9) satisfies 8x + 9y = 89.", "math-linear-graph.svg", "Linear Equations", "Two variables represented on a straight-line graph");
    registerOverride("Write the equation represented by: x + y = 18 and x - y = 10.", "math-linear-graph.svg", "Linear Equations", "Two variables represented on a straight-line graph");
    registerOverride("Find the value of y when x = 10 in the equation 11x + y = 37.", "math-linear-graph.svg", "Linear Equations", "Two variables represented on a straight-line graph");
    registerOverride("Find the mean of the data: 2, 4, 6, 8, 10.", "math-statistics.svg", "Statistics", "Data represented and summarized");
    registerOverride("Find the mean of the data: 3, 5, 7, 9, 11.", "math-statistics.svg", "Statistics", "Data represented and summarized");
    registerOverride("Find the mean of the data: 4, 6, 8, 10, 12.", "math-statistics.svg", "Statistics", "Data represented and summarized");
    registerOverride("Find the mean of the data: 5, 7, 9, 11, 13.", "math-statistics.svg", "Statistics", "Data represented and summarized");
    registerOverride("Find the mean of the data: 6, 8, 10, 12, 14.", "math-statistics.svg", "Statistics", "Data represented and summarized");
    registerOverride("Find the mean of the data: 7, 9, 11, 13, 15.", "math-statistics.svg", "Statistics", "Data represented and summarized");
    registerOverride("Find the mean of the data: 8, 10, 12, 14, 16.", "math-statistics.svg", "Statistics", "Data represented and summarized");
    registerOverride("Find the mode of the data: 9, 10, 10, 12, 14, 14, 14.", "math-statistics.svg", "Statistics", "Data represented and summarized");
    registerOverride("Find the mode of the data: 10, 11, 11, 13, 15, 15, 15.", "math-statistics.svg", "Statistics", "Data represented and summarized");
    registerOverride("Find the mode of the data: 11, 12, 12, 14, 16, 16, 16.", "math-statistics.svg", "Statistics", "Data represented and summarized");
    registerOverride("Find the mode of the data: 12, 13, 13, 15, 17, 17, 17.", "math-statistics.svg", "Statistics", "Data represented and summarized");
    registerOverride("Find the mode of the data: 13, 14, 14, 16, 18, 18, 18.", "math-statistics.svg", "Statistics", "Data represented and summarized");
    registerOverride("Find the mode of the data: 14, 15, 15, 17, 19, 19, 19.", "math-statistics.svg", "Statistics", "Data represented and summarized");
    registerOverride("Find the mode of the data: 15, 16, 16, 18, 20, 20, 20.", "math-statistics.svg", "Statistics", "Data represented and summarized");
    registerOverride("Find the median of: 16, 18, 20, 22, 24.", "math-statistics.svg", "Statistics", "Data represented and summarized");
    registerOverride("Find the median of: 17, 19, 21, 23, 25.", "math-statistics.svg", "Statistics", "Data represented and summarized");
    registerOverride("Find the median of: 18, 20, 22, 24, 26.", "math-statistics.svg", "Statistics", "Data represented and summarized");
    registerOverride("Find the median of: 19, 21, 23, 25, 27.", "math-statistics.svg", "Statistics", "Data represented and summarized");
    registerOverride("Find the median of: 20, 22, 24, 26, 28.", "math-statistics.svg", "Statistics", "Data represented and summarized");
    registerOverride("Find the median of: 21, 23, 25, 27, 29.", "math-statistics.svg", "Statistics", "Data represented and summarized");
    registerOverride("A family earns ₹20000 per month and saves ₹3000. Find its monthly expenditure.", "math-financial.svg", "Financial Planning", "Income, saving, interest and investment");
    registerOverride("A family earns ₹22500 per month and saves ₹3500. Find its monthly expenditure.", "math-financial.svg", "Financial Planning", "Income, saving, interest and investment");
    registerOverride("A family earns ₹25000 per month and saves ₹4000. Find its monthly expenditure.", "math-financial.svg", "Financial Planning", "Income, saving, interest and investment");
    registerOverride("A family earns ₹27500 per month and saves ₹4500. Find its monthly expenditure.", "math-financial.svg", "Financial Planning", "Income, saving, interest and investment");
    registerOverride("A family earns ₹30000 per month and saves ₹5000. Find its monthly expenditure.", "math-financial.svg", "Financial Planning", "Income, saving, interest and investment");
    registerOverride("A family earns ₹32500 per month and saves ₹5500. Find its monthly expenditure.", "math-financial.svg", "Financial Planning", "Income, saving, interest and investment");
    registerOverride("A family earns ₹35000 per month and saves ₹6000. Find its monthly expenditure.", "math-financial.svg", "Financial Planning", "Income, saving, interest and investment");
    registerOverride("An investment of ₹85000 earns simple interest at 8% per year for 2 years. Find the interest.", "math-financial.svg", "Financial Planning", "Income, saving, interest and investment");
    registerOverride("An investment of ₹90000 earns simple interest at 5% per year for 2 years. Find the interest.", "math-financial.svg", "Financial Planning", "Income, saving, interest and investment");
    registerOverride("An investment of ₹95000 earns simple interest at 6% per year for 2 years. Find the interest.", "math-financial.svg", "Financial Planning", "Income, saving, interest and investment");
    registerOverride("An investment of ₹100000 earns simple interest at 7% per year for 2 years. Find the interest.", "math-financial.svg", "Financial Planning", "Income, saving, interest and investment");
    registerOverride("An investment of ₹105000 earns simple interest at 8% per year for 2 years. Find the interest.", "math-financial.svg", "Financial Planning", "Income, saving, interest and investment");
    registerOverride("An investment of ₹110000 earns simple interest at 5% per year for 2 years. Find the interest.", "math-financial.svg", "Financial Planning", "Income, saving, interest and investment");
    registerOverride("An investment of ₹115000 earns simple interest at 6% per year for 2 years. Find the interest.", "math-financial.svg", "Financial Planning", "Income, saving, interest and investment");
    registerOverride("A person invests ₹136000 in an instrument giving 10% annual return. Find the expected return for one year.", "math-financial.svg", "Financial Planning", "Income, saving, interest and investment");
    registerOverride("A person invests ₹140000 in an instrument giving 10% annual return. Find the expected return for one year.", "math-financial.svg", "Financial Planning", "Income, saving, interest and investment");
    registerOverride("A person invests ₹144000 in an instrument giving 10% annual return. Find the expected return for one year.", "math-financial.svg", "Financial Planning", "Income, saving, interest and investment");
    registerOverride("A person invests ₹148000 in an instrument giving 10% annual return. Find the expected return for one year.", "math-financial.svg", "Financial Planning", "Income, saving, interest and investment");
    registerOverride("A person invests ₹152000 in an instrument giving 10% annual return. Find the expected return for one year.", "math-financial.svg", "Financial Planning", "Income, saving, interest and investment");
    registerOverride("A person invests ₹156000 in an instrument giving 10% annual return. Find the expected return for one year.", "math-financial.svg", "Financial Planning", "Income, saving, interest and investment");
    registerOverride("Solve the quadratic equation x² -3x +2 = 0.", "math-quadratic.svg", "Quadratic Equation", "Quadratic relation and its roots");
    registerOverride("Solve the quadratic equation x² -5x +6 = 0.", "math-quadratic.svg", "Quadratic Equation", "Quadratic relation and its roots");
    registerOverride("Solve the quadratic equation x² -7x +12 = 0.", "math-quadratic.svg", "Quadratic Equation", "Quadratic relation and its roots");
    registerOverride("Solve the quadratic equation x² -9x +20 = 0.", "math-quadratic.svg", "Quadratic Equation", "Quadratic relation and its roots");
    registerOverride("Solve the quadratic equation x² -7x +10 = 0.", "math-quadratic.svg", "Quadratic Equation", "Quadratic relation and its roots");
    registerOverride("Solve the quadratic equation x² -4x +3 = 0.", "math-quadratic.svg", "Quadratic Equation", "Quadratic relation and its roots");
    registerOverride("Solve the quadratic equation x² -6x +8 = 0.", "math-quadratic.svg", "Quadratic Equation", "Quadratic relation and its roots");
    registerOverride("Solve the quadratic equation x² -8x +15 = 0.", "math-quadratic.svg", "Quadratic Equation", "Quadratic relation and its roots");
    registerOverride("Solve the quadratic equation x² -6x +8 = 0.", "math-quadratic.svg", "Quadratic Equation", "Quadratic relation and its roots");
    registerOverride("Solve the quadratic equation x² -8x +15 = 0.", "math-quadratic.svg", "Quadratic Equation", "Quadratic relation and its roots");
    registerOverride("Find the discriminant of 2x² -13x +11 = 0 and state the nature of its roots.", "math-quadratic.svg", "Quadratic Equation", "Quadratic relation and its roots");
    registerOverride("Find the discriminant of 3x² -14x +12 = 0 and state the nature of its roots.", "math-quadratic.svg", "Quadratic Equation", "Quadratic relation and its roots");
    registerOverride("Find the discriminant of 1x² -15x +13 = 0 and state the nature of its roots.", "math-quadratic.svg", "Quadratic Equation", "Quadratic relation and its roots");
    registerOverride("Find the discriminant of 2x² -16x +14 = 0 and state the nature of its roots.", "math-quadratic.svg", "Quadratic Equation", "Quadratic relation and its roots");
    registerOverride("Find the discriminant of 3x² -17x +15 = 0 and state the nature of its roots.", "math-quadratic.svg", "Quadratic Equation", "Quadratic relation and its roots");
    registerOverride("Find the discriminant of 1x² -18x +16 = 0 and state the nature of its roots.", "math-quadratic.svg", "Quadratic Equation", "Quadratic relation and its roots");
    registerOverride("Find the discriminant of 2x² -19x +17 = 0 and state the nature of its roots.", "math-quadratic.svg", "Quadratic Equation", "Quadratic relation and its roots");
    registerOverride("Find the discriminant of 3x² -20x +18 = 0 and state the nature of its roots.", "math-quadratic.svg", "Quadratic Equation", "Quadratic relation and its roots");
    registerOverride("Find the discriminant of 1x² -21x +19 = 0 and state the nature of its roots.", "math-quadratic.svg", "Quadratic Equation", "Quadratic relation and its roots");
    registerOverride("Find the discriminant of 2x² -22x +20 = 0 and state the nature of its roots.", "math-quadratic.svg", "Quadratic Equation", "Quadratic relation and its roots");

    function normalize(value) {
        return String(value || "")
            .toLowerCase()
            .replace(/[–—−]/g, "-")
            .replace(/\s+/g, " ")
            .trim();
    }

    function fieldText(question, field) {
        return normalize(question && question[field]);
    }

    function hasExactPhrase(text, term) {
        const t = normalize(term);
        if (!text || !t) return false;
        try {
            const escaped = t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
            return new RegExp(`(?:^|[^\\p{L}\\p{N}])${escaped}(?:$|[^\\p{L}\\p{N}])`, "u").test(text);
        } catch (e) {
            return text === t || text.includes(t);
        }
    }

    function scoreRule(rule, question) {
        // V5 is deliberately strict. The chapter name and subject name are NEVER
        // considered. Question text gets the strongest weight, then keywords,
        // then the easy answer. This prevents one chapter's picture from being
        // reused simply because every question belongs to that chapter.
        const fields = [
            ["question_text", 1000],
            ["keywords", 500],
            ["easy_answer", 250]
        ];
        let score = 0;
        let matched = "";
        let source = "";

        for (const [field, weight] of fields) {
            const text = fieldText(question, field);
            if (!text) continue;
            for (const term of rule.terms) {
                if (!hasExactPhrase(text, term)) continue;
                const specificity = Math.min(120, normalize(term).length * 3);
                const candidate = weight + specificity;
                if (candidate > score) {
                    score = candidate;
                    matched = term;
                    source = field;
                }
            }
        }
        return { score, matched, source };
    }

    // V6: explicit per-question visual tags take absolute priority. New quality-gap
    // questions carry VisualTag:<asset-key> in keywords, so every new question can
    // have its own visual instead of inheriting a chapter-level image.
    const TAGGED_VISUALS = new Map(VISUAL_RULES.map(r => [r.asset.replace(/\.svg$/,''), r]));
    // V6 quality-gap visuals: one dedicated internal SVG for each newly added question.
    for (let ch = 1; ch <= 10; ch++) {
        for (let n = 11; n <= 20; n++) {
            const key = `geo_q${ch}_${n}`;
            TAGGED_VISUALS.set(key, { asset: `${key}.svg`, title: `Geography visual ${ch}.${n}`, caption: "Question-specific black-and-white learning aid", terms: [key] });
        }
    }
    for (let n = 21; n <= 27; n++) {
        const key = `math_p1_q5_${n}`;
        TAGGED_VISUALS.set(key, { asset: `${key}.svg`, title: `Probability visual ${n}`, caption: "Question-specific black-and-white learning aid", terms: [key] });
    }


    function getVisualTag(question) {
        const k = String(question && question.keywords || '');
        const m = k.match(/VisualTag\s*:\s*([A-Za-z0-9_-]+)/i);
        return m ? m[1] : '';
    }

    const QUESTION_OVERRIDES = {};

    function registerOverride(questionText, asset, title, caption) {
        if (!questionText || !asset) return;
        QUESTION_OVERRIDES[normalize(questionText)] = { asset, title, caption, terms: [questionText] };
    }

    function findVisual(question) {
        if (!question) return null;

        const tag = getVisualTag(question);
        if (tag && TAGGED_VISUALS.has(tag)) {
            return { rule: TAGGED_VISUALS.get(tag), score: 100000, matched: tag, source: "VisualTag" };
        }

        const override = QUESTION_OVERRIDES[normalize(question.question_text)];
        if (override) return { rule: override, score: 90000, matched: override.title, source: "Question-specific" };

        const scored = VISUAL_RULES
            .map(rule => ({ rule, ...scoreRule(rule, question) }))
            .filter(item => item.score > 0)
            .sort((a, b) => b.score - a.score);

        // Require an actual content match. No fallback to subject/chapter.
        if (!scored.length) return null;
        return scored[0];
    }

    function escapeHtml(value) {
        return String(value || "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function renderVisualLearning(question) {
        const result = findVisual(question);
        let rule, matched;

        if (result) {
            rule = result.rule;
            matched = result.matched;
        } else {
            // Guaranteed educational fallback: do not leave the learner
            // without a visual simply because a question has weak keywords.
            const text = [question && question.question_text, question && question.keywords, question && question.easy_answer]
                .join(" ").toLowerCase();
            let asset = "language-keywords.svg", title = "Remember visually", caption = "Connect the key idea with the picture.";
            if (/mean|median|mode|statistics|frequency|data/.test(text)) { asset="math-statistics.svg"; title="Statistics"; caption="Compare data values and remember the key statistical idea."; }
            else if (/probability|sample space|outcome|dice|die/.test(text)) { asset="math-probability.svg"; title="Probability"; caption="Think about possible outcomes and the sample space."; }
            else if (/linear equation|two variables|straight line|coordinate/.test(text)) { asset="math-linear-graph.svg"; title="Linear Equation"; caption="A linear equation can be represented by a straight-line graph."; }
            else if (/quadratic|roots|discriminant/.test(text)) { asset="math-quadratic.svg"; title="Quadratic Equation"; caption="Remember the quadratic equation and its roots."; }
            else if (/circle|radius|diameter|chord/.test(text)) { asset="math-circle.svg"; title="Circle"; caption="Remember centre, radius, diameter and chord."; }
            else if (/pythagoras|right triangle|hypotenuse/.test(text)) { asset="math-pythagoras.svg"; title="Pythagoras Theorem"; caption="For a right triangle, a² + b² = c²."; }
            else if (/trigonometry|sine|cosine|tangent/.test(text)) { asset="math-trigonometry.svg"; title="Trigonometry"; caption="Connect trigonometric ratios with a right triangle."; }
            else if (/electric current|electric circuit|voltage|resistance|solenoid/.test(text)) { asset="sci-circuit.svg"; title="Electric Current"; caption="A closed circuit allows current to flow."; }
            else if (/chemical reaction|reactant|product|chemical equation/.test(text)) { asset="sci-reaction.svg"; title="Chemical Reaction"; caption="Reactants change into products."; }
            else if (/gravitation|gravity|gravitational force/.test(text)) { asset="sci-gravitation.svg"; title="Gravitation"; caption="Objects attract each other due to gravitational force."; }
            else if (/democracy|election|constitution|voting|political party/.test(text)) { asset="civics-democracy.svg"; title="Democracy"; caption="Citizens participate through voting and representation."; }
            else if (/history|timeline|chronology|century|movement/.test(text)) { asset="history-timeline.svg"; title="History Timeline"; caption="Place important events in chronological order."; }
            else if (/latitude|longitude|location|direction|map/.test(text)) { asset="geo-location-grid.svg"; title="Geographical Location"; caption="Use location and direction to understand the topic."; }
            rule = {asset,title,caption}; matched = "Key idea";
        }

        const src = BASE + rule.asset;
        return `
            <div class="visual-learning-card" aria-label="Automatic visual learning aid">
                <div class="visual-learning-heading">🖼️ चित्रातून लक्षात ठेवा</div>
                <div class="visual-learning-body">
                    <div class="visual-learning-keyword">
                        <span class="visual-learning-label">Related keyword</span>
                        <strong>${escapeHtml(matched)}</strong>
                    </div>
                    <img class="visual-learning-image" src="${src}" alt="${escapeHtml(rule.title)}" loading="lazy">
                    <div class="visual-learning-caption">
                        <strong>${escapeHtml(rule.title)}</strong>
                        <span>${escapeHtml(rule.caption)}</span>
                    </div>
                </div>
            </div>
        `;
    }

    window.renderVisualLearning = renderVisualLearning;
    window.VisualLearningEngine = {
        version: "6.0",
        ruleCount: VISUAL_RULES.length,
        assetCount: VISUAL_RULES.length,
        findVisual,
        rules: VISUAL_RULES.map(rule => ({ asset: rule.asset, title: rule.title }))
    };
})();
