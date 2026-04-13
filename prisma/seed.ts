import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const units = [
  { number: 1, name: 'The Global Tapestry', description: 'Explore the diverse civilizations and states of the world from 1200-1450, including East Asia, Dar al-Islam, South and Southeast Asia, the Americas, and Sub-Saharan Africa.', timePeriod: '1200-1450' },
  { number: 2, name: 'Networks of Exchange', description: 'Examine how trade networks like the Silk Roads, Indian Ocean trade, and trans-Saharan routes connected civilizations and spread ideas, goods, and diseases.', timePeriod: '1200-1450' },
  { number: 3, name: 'Land-Based Empires', description: 'Analyze the rise and expansion of powerful land-based empires including the Ottoman, Safavid, Mughal, and Ming empires between 1450-1750.', timePeriod: '1450-1750' },
  { number: 4, name: 'Transoceanic Interconnections', description: 'Investigate how European exploration and colonization created new global trade networks, the Columbian Exchange, and transformed societies worldwide.', timePeriod: '1450-1750' },
  { number: 5, name: 'Revolutions', description: 'Study the political and social revolutions of 1750-1900, including the American, French, Haitian, and Latin American revolutions, and the spread of enlightenment ideas.', timePeriod: '1750-1900' },
  { number: 6, name: 'Consequences of Industrialization', description: 'Examine how industrialization transformed economies, societies, and the environment, leading to new forms of imperialism and global inequality.', timePeriod: '1750-1900' },
  { number: 7, name: 'Global Conflict', description: 'Analyze the causes and consequences of World War I, World War II, the interwar period, and the rise of totalitarianism between 1900-1945.', timePeriod: '1900-1945' },
  { number: 8, name: 'Cold War and Decolonization', description: 'Explore the Cold War competition between the US and USSR, the decolonization of Asia and Africa, and the emergence of new nations between 1945-1980.', timePeriod: '1945-1980' },
  { number: 9, name: 'Globalization', description: 'Investigate contemporary globalization trends including economic integration, cultural exchange, technological change, and global challenges from 1980 to the present.', timePeriod: '1980-present' },
]

async function main() {
  console.log('Seeding database...')

  // Upsert units
  const createdUnits: Record<number, { id: string; number: number; name: string }> = {}
  for (const unit of units) {
    const created = await prisma.unit.upsert({
      where: { number: unit.number },
      update: unit,
      create: unit,
    })
    createdUnits[unit.number] = created
  }

  // Helper to upsert question
  async function upsertQuestion(data: {
    unitId: string
    type: string
    prompt: string
    stimulus?: string
    choices?: string
    correctAnswer?: string
    explanation?: string
    historicalThinkingSkill: string
    difficulty: number
    timePeriod: string
  }) {
    return prisma.question.upsert({
      where: { id: `q_${data.unitId}_${data.type}_${data.prompt.slice(0, 30).replace(/\s/g, '_')}` },
      update: data,
      create: {
        id: `q_${data.unitId}_${data.type}_${data.prompt.slice(0, 30).replace(/\s/g, '_')}`,
        ...data,
      },
    })
  }

  // ---------- UNIT 1 QUESTIONS ----------
  const u1 = createdUnits[1].id
  await upsertQuestion({
    unitId: u1, type: 'MCQ',
    prompt: 'Which dynasty ruled China during the period 960-1279 CE and is known for its economic innovations including paper money?',
    choices: JSON.stringify(['Tang Dynasty', 'Song Dynasty', 'Ming Dynasty', 'Yuan Dynasty']),
    correctAnswer: 'Song Dynasty',
    explanation: 'The Song Dynasty (960-1279) was known for paper money, gunpowder weapons, and extensive trade networks that facilitated economic growth in East Asia.',
    historicalThinkingSkill: 'Causation', difficulty: 2, timePeriod: '1200-1450',
  })
  await upsertQuestion({
    unitId: u1, type: 'MCQ',
    prompt: 'The Mali Empire reached its peak under which ruler, famous for his 1324 pilgrimage to Mecca?',
    choices: JSON.stringify(['Sundiata Keita', 'Mansa Musa', 'Askia Muhammad', 'Sunni Ali']),
    correctAnswer: 'Mansa Musa',
    explanation: 'Mansa Musa (r. 1312-1337) was the ruler of the Mali Empire whose lavish pilgrimage to Mecca distributed so much gold that it caused inflation across North Africa and the Middle East.',
    historicalThinkingSkill: 'Contextualization', difficulty: 2, timePeriod: '1200-1450',
  })
  await upsertQuestion({
    unitId: u1, type: 'MCQ',
    prompt: 'Which of the following best describes the political structure of the Mongol Empire after the death of Genghis Khan?',
    choices: JSON.stringify(['A unified empire ruled by a single khan', 'Four separate khanates with shared Mongol identity', 'A confederation of city-states', 'A theocratic empire ruled by Islamic scholars']),
    correctAnswer: 'Four separate khanates with shared Mongol identity',
    explanation: 'After Genghis Khan\'s death, the Mongol Empire split into four khanates: the Yuan Dynasty in China, the Ilkhanate in Persia, the Chagatai Khanate in Central Asia, and the Golden Horde in Russia.',
    historicalThinkingSkill: 'Continuity and Change Over Time', difficulty: 3, timePeriod: '1200-1450',
  })
  await upsertQuestion({
    unitId: u1, type: 'SAQ',
    prompt: 'Briefly explain ONE way in which the Song Dynasty contributed to economic development in East Asia between 1200 and 1450.',
    historicalThinkingSkill: 'Continuity and Change Over Time', difficulty: 3, timePeriod: '1200-1450',
  })
  await upsertQuestion({
    unitId: u1, type: 'SAQ',
    prompt: 'Briefly explain ONE similarity between the political structures of the Mali Empire and the Delhi Sultanate in the period 1200-1450.',
    historicalThinkingSkill: 'Comparison', difficulty: 3, timePeriod: '1200-1450',
  })
  await upsertQuestion({
    unitId: u1, type: 'LEQ',
    prompt: 'Evaluate the extent to which the Mongol conquests changed political structures in Afro-Eurasia in the period 1200-1450.',
    historicalThinkingSkill: 'Argumentation', difficulty: 5, timePeriod: '1200-1450',
  })

  // ---------- UNIT 2 QUESTIONS ----------
  const u2 = createdUnits[2].id
  await upsertQuestion({
    unitId: u2, type: 'MCQ',
    prompt: 'The spread of the Black Death across Eurasia in the 14th century is best explained by which factor?',
    choices: JSON.stringify(['Mongol biological warfare', 'Increased trade along the Silk Roads', 'Climate change causing famine', 'Crusader pilgrimages to the Holy Land']),
    correctAnswer: 'Increased trade along the Silk Roads',
    explanation: 'The Silk Roads facilitated not only the exchange of goods but also the spread of diseases like the Black Death, which followed trade routes from Central Asia to Europe and the Middle East.',
    historicalThinkingSkill: 'Causation', difficulty: 3, timePeriod: '1200-1450',
  })
  await upsertQuestion({
    unitId: u2, type: 'MCQ',
    prompt: 'Which of the following was a major commodity traded along the Indian Ocean trade network between 1200 and 1450?',
    choices: JSON.stringify(['Beaver pelts', 'Spices from Southeast Asia', 'Silver from the Americas', 'Rubber from the Congo']),
    correctAnswer: 'Spices from Southeast Asia',
    explanation: 'Spices from Southeast Asia, including pepper, nutmeg, and cloves, were among the most valuable commodities traded across the Indian Ocean network during this period.',
    historicalThinkingSkill: 'Contextualization', difficulty: 2, timePeriod: '1200-1450',
  })
  await upsertQuestion({
    unitId: u2, type: 'MCQ',
    prompt: 'How did the Hanseatic League primarily contribute to commerce in northern Europe between 1200 and 1450?',
    choices: JSON.stringify(['By establishing a common currency', 'By creating a network of trading cities that cooperated commercially', 'By conquering new territories for trade', 'By sponsoring transoceanic voyages']),
    correctAnswer: 'By creating a network of trading cities that cooperated commercially',
    explanation: 'The Hanseatic League was a commercial confederation of merchant guilds and market towns in northern Europe that dominated trade in the Baltic and North Sea regions.',
    historicalThinkingSkill: 'Causation', difficulty: 3, timePeriod: '1200-1450',
  })
  await upsertQuestion({
    unitId: u2, type: 'SAQ',
    prompt: 'Briefly explain ONE way in which the Silk Roads facilitated cultural exchange between 1200 and 1450.',
    historicalThinkingSkill: 'Continuity and Change Over Time', difficulty: 3, timePeriod: '1200-1450',
  })
  await upsertQuestion({
    unitId: u2, type: 'SAQ',
    prompt: 'Briefly explain ONE difference between the Indian Ocean trade network and the trans-Saharan trade network in the period 1200-1450.',
    historicalThinkingSkill: 'Comparison', difficulty: 3, timePeriod: '1200-1450',
  })
  await upsertQuestion({
    unitId: u2, type: 'DBQ',
    prompt: 'Evaluate the extent to which the Silk Roads transformed societies in Afro-Eurasia between 1200 and 1450.',
    stimulus: 'Document 1: Ibn Battuta, Rihla (Travels), c. 1355 — "I set out alone, finding no companion to cheer the way, and no party of travellers with whom to associate. Swayed by an overmastering impulse within me and a long-cherished desire to visit those glorious sanctuaries, I resolved to quit all my friends and tear myself away from my home."\n\nDocument 2: Marco Polo, Travels, c. 1300 — "The whole of this province is full of mulberry trees, which feed the silkworms. There are numerous merchants who travel about Cathay [China] and carry with them much merchandise of silk, and they sell it throughout many kingdoms."\n\nDocument 3: Anonymous Arab Merchant, Commercial Handbook, c. 1200 — "The most valuable goods coming from China are silk fabrics, porcelain, and iron. In exchange, the merchants of Arabia send frankincense, copper vessels, and cotton cloth."',
    historicalThinkingSkill: 'Argumentation', difficulty: 5, timePeriod: '1200-1450',
  })
  await upsertQuestion({
    unitId: u2, type: 'LEQ',
    prompt: 'Evaluate the extent to which cross-cultural exchanges on the Silk Roads contributed to technological and cultural diffusion in Afro-Eurasia between 1200 and 1450.',
    historicalThinkingSkill: 'Argumentation', difficulty: 5, timePeriod: '1200-1450',
  })

  // ---------- UNIT 3 QUESTIONS ----------
  const u3 = createdUnits[3].id
  await upsertQuestion({
    unitId: u3, type: 'MCQ',
    prompt: 'The Ottoman Empire\'s conquest of Constantinople in 1453 had which of the following major effects?',
    choices: JSON.stringify(['It ended the Byzantine Empire and gave the Ottomans control of a key trade hub', 'It sparked the Protestant Reformation in Western Europe', 'It led to the immediate decline of Ottoman power', 'It caused the Ming Dynasty to close China to foreign trade']),
    correctAnswer: 'It ended the Byzantine Empire and gave the Ottomans control of a key trade hub',
    explanation: 'The Ottoman conquest of Constantinople ended the Byzantine Empire and gave the Ottomans control over trade routes connecting Europe and Asia, accelerating European efforts to find alternative sea routes.',
    historicalThinkingSkill: 'Causation', difficulty: 2, timePeriod: '1450-1750',
  })
  await upsertQuestion({
    unitId: u3, type: 'MCQ',
    prompt: 'Which of the following best explains why the Mughal Empire was able to govern a diverse population in South Asia?',
    choices: JSON.stringify(['It converted all subjects to Islam by force', 'It practiced religious tolerance and incorporated local elites into administration', 'It isolated itself from foreign influences', 'It relied exclusively on military conquest to maintain order']),
    correctAnswer: 'It practiced religious tolerance and incorporated local elites into administration',
    explanation: 'The Mughal Empire, especially under Akbar, practiced religious tolerance (sulh-i-kul) and incorporated Hindu Rajput nobles into the imperial administration, allowing for effective governance of a diverse population.',
    historicalThinkingSkill: 'Contextualization', difficulty: 3, timePeriod: '1450-1750',
  })
  await upsertQuestion({
    unitId: u3, type: 'MCQ',
    prompt: 'The Safavid Empire distinguished itself from the Ottoman and Mughal empires primarily through its adoption of which religious policy?',
    choices: JSON.stringify(['Sunni Islam as the official state religion', 'Twelver Shia Islam as the official state religion', 'Hinduism as a tolerant governing ideology', 'Secular governance separating religion from state']),
    correctAnswer: 'Twelver Shia Islam as the official state religion',
    explanation: 'The Safavid Empire adopted Twelver Shia Islam as the state religion, which created a distinct Persian-Shia identity and intensified conflicts with the Sunni Ottoman Empire.',
    historicalThinkingSkill: 'Comparison', difficulty: 3, timePeriod: '1450-1750',
  })
  await upsertQuestion({
    unitId: u3, type: 'SAQ',
    prompt: 'Briefly explain ONE way in which the Ottoman Empire used gunpowder technology to expand its power between 1450 and 1750.',
    historicalThinkingSkill: 'Causation', difficulty: 3, timePeriod: '1450-1750',
  })
  await upsertQuestion({
    unitId: u3, type: 'SAQ',
    prompt: 'Briefly explain ONE way in which the Mughal Empire\'s administrative policies differed from those of earlier Islamic empires in South Asia.',
    historicalThinkingSkill: 'Comparison', difficulty: 4, timePeriod: '1450-1750',
  })
  await upsertQuestion({
    unitId: u3, type: 'LEQ',
    prompt: 'Evaluate the extent to which the Ottoman, Safavid, and Mughal empires used similar methods to consolidate and expand their power between 1450 and 1750.',
    historicalThinkingSkill: 'Comparison', difficulty: 5, timePeriod: '1450-1750',
  })

  // ---------- UNIT 4 QUESTIONS ----------
  const u4 = createdUnits[4].id
  await upsertQuestion({
    unitId: u4, type: 'MCQ',
    prompt: 'The Columbian Exchange most directly contributed to population growth in which region during the 16th and 17th centuries?',
    choices: JSON.stringify(['Sub-Saharan Africa', 'East Asia', 'The Americas', 'Western Europe']),
    correctAnswer: 'Western Europe',
    explanation: 'New World crops like potatoes and maize introduced through the Columbian Exchange provided calorie-dense foods that helped fuel population growth in Western Europe and later in other regions.',
    historicalThinkingSkill: 'Causation', difficulty: 3, timePeriod: '1450-1750',
  })
  await upsertQuestion({
    unitId: u4, type: 'MCQ',
    prompt: 'Which of the following best explains why the Portuguese were able to dominate Indian Ocean trade in the early 16th century?',
    choices: JSON.stringify(['They offered lower prices than Arab merchants', 'They had superior naval technology and used force to establish trading posts', 'They formed peaceful alliances with all Indian Ocean states', 'They discovered new trade goods that replaced existing commodities']),
    correctAnswer: 'They had superior naval technology and used force to establish trading posts',
    explanation: 'The Portuguese used cannon-armed ships and military force to establish fortified trading posts (feitorias) at key points in the Indian Ocean, allowing them to control and tax trade routes.',
    historicalThinkingSkill: 'Causation', difficulty: 3, timePeriod: '1450-1750',
  })
  await upsertQuestion({
    unitId: u4, type: 'MCQ',
    prompt: 'The encomienda system in Spanish colonial America was primarily designed to do which of the following?',
    choices: JSON.stringify(['Provide free land to Spanish settlers', 'Organize indigenous labor for Spanish colonists', 'Convert indigenous people to Protestantism', 'Establish democratic governance in the colonies']),
    correctAnswer: 'Organize indigenous labor for Spanish colonists',
    explanation: 'The encomienda system granted Spanish colonists the right to extract labor and tribute from indigenous people in exchange for their protection and religious instruction.',
    historicalThinkingSkill: 'Contextualization', difficulty: 2, timePeriod: '1450-1750',
  })
  await upsertQuestion({
    unitId: u4, type: 'SAQ',
    prompt: 'Briefly explain ONE way in which European colonization of the Americas affected indigenous populations between 1450 and 1750.',
    historicalThinkingSkill: 'Causation', difficulty: 2, timePeriod: '1450-1750',
  })
  await upsertQuestion({
    unitId: u4, type: 'SAQ',
    prompt: 'Briefly explain ONE way in which the Atlantic slave trade changed African societies between 1450 and 1750.',
    historicalThinkingSkill: 'Causation', difficulty: 3, timePeriod: '1450-1750',
  })
  await upsertQuestion({
    unitId: u4, type: 'LEQ',
    prompt: 'Evaluate the extent to which European maritime expansion transformed global trade networks between 1450 and 1750.',
    historicalThinkingSkill: 'Argumentation', difficulty: 5, timePeriod: '1450-1750',
  })

  // ---------- UNIT 5 QUESTIONS ----------
  const u5 = createdUnits[5].id
  await upsertQuestion({
    unitId: u5, type: 'MCQ',
    prompt: 'Which of the following best explains why the Haitian Revolution (1791-1804) was particularly significant in world history?',
    choices: JSON.stringify(['It was the first successful revolution inspired by Enlightenment ideals', 'It was the only successful slave revolt that led to an independent nation', 'It resulted in the largest territorial expansion in the Americas', 'It was the first revolution to establish a democratic republic']),
    correctAnswer: 'It was the only successful slave revolt that led to an independent nation',
    explanation: 'The Haitian Revolution was unique as the only successful slave revolt in history that resulted in the creation of an independent nation (Haiti), challenging the institution of slavery and inspiring other liberation movements.',
    historicalThinkingSkill: 'Continuity and Change Over Time', difficulty: 3, timePeriod: '1750-1900',
  })
  await upsertQuestion({
    unitId: u5, type: 'MCQ',
    prompt: 'The spread of revolutionary ideas from France to Latin America in the early 19th century is best explained by which factor?',
    choices: JSON.stringify(['French military conquest of Latin America', 'The spread of Enlightenment ideas through educated elites', 'Direct French colonization of Latin American territories', 'Trade relationships between France and Latin American colonies']),
    correctAnswer: 'The spread of Enlightenment ideas through educated elites',
    explanation: 'Enlightenment ideas about natural rights and popular sovereignty spread to Latin America through educated creole elites who had studied in Europe or read European philosophical works.',
    historicalThinkingSkill: 'Causation', difficulty: 3, timePeriod: '1750-1900',
  })
  await upsertQuestion({
    unitId: u5, type: 'MCQ',
    prompt: 'How did Napoleon Bonaparte\'s invasion of Spain in 1808 most directly affect Latin American independence movements?',
    choices: JSON.stringify(['It provided military support to Latin American revolutionaries', 'It weakened Spanish authority, creating a power vacuum that empowered independence leaders', 'It led France to colonize Latin American territories', 'It caused Spain to grant immediate independence to its colonies']),
    correctAnswer: 'It weakened Spanish authority, creating a power vacuum that empowered independence leaders',
    explanation: 'Napoleon\'s removal of the Spanish king destabilized Spanish colonial rule, creating a political crisis that empowered Latin American creoles to question the legitimacy of colonial governance.',
    historicalThinkingSkill: 'Causation', difficulty: 3, timePeriod: '1750-1900',
  })
  await upsertQuestion({
    unitId: u5, type: 'SAQ',
    prompt: 'Briefly explain ONE way in which the French Revolution influenced political movements outside of France between 1789 and 1850.',
    historicalThinkingSkill: 'Causation', difficulty: 3, timePeriod: '1750-1900',
  })
  await upsertQuestion({
    unitId: u5, type: 'SAQ',
    prompt: 'Briefly explain ONE similarity between the American Revolution and the Latin American independence movements of the early 19th century.',
    historicalThinkingSkill: 'Comparison', difficulty: 3, timePeriod: '1750-1900',
  })
  await upsertQuestion({
    unitId: u5, type: 'LEQ',
    prompt: 'Evaluate the extent to which Enlightenment ideas caused the political revolutions of the late 18th and early 19th centuries.',
    historicalThinkingSkill: 'Argumentation', difficulty: 5, timePeriod: '1750-1900',
  })

  // ---------- UNIT 6 QUESTIONS ----------
  const u6 = createdUnits[6].id
  await upsertQuestion({
    unitId: u6, type: 'MCQ',
    prompt: 'Which of the following best explains why industrialization began in Britain rather than elsewhere in the world?',
    choices: JSON.stringify(['Britain had the most advanced mathematical and scientific knowledge', 'Britain had abundant coal, a colonial empire, and favorable banking institutions', 'Britain had the largest population in Europe', 'Britain was geographically isolated from European conflicts']),
    correctAnswer: 'Britain had abundant coal, a colonial empire, and favorable banking institutions',
    explanation: 'Britain\'s industrialization benefited from abundant coal and iron resources, raw materials from colonies, capital from banking systems, and a large domestic market.',
    historicalThinkingSkill: 'Causation', difficulty: 3, timePeriod: '1750-1900',
  })
  await upsertQuestion({
    unitId: u6, type: 'MCQ',
    prompt: 'The "New Imperialism" of the late 19th century differed from earlier European colonialism primarily in that it:',
    choices: JSON.stringify(['Focused exclusively on establishing settler colonies', 'Involved the rapid conquest and formal control of entire continents', 'Relied on peaceful trade agreements rather than force', 'Was driven primarily by religious missionary work']),
    correctAnswer: 'Involved the rapid conquest and formal control of entire continents',
    explanation: 'The New Imperialism of the late 19th century was characterized by the rapid formal colonization of Africa and Asia by European powers, driven by industrial needs for raw materials and markets.',
    historicalThinkingSkill: 'Comparison', difficulty: 3, timePeriod: '1750-1900',
  })
  await upsertQuestion({
    unitId: u6, type: 'MCQ',
    prompt: 'Which of the following was a major social consequence of industrialization in 19th century Europe?',
    choices: JSON.stringify(['The elimination of poverty in industrial cities', 'The growth of an urban industrial working class with poor living conditions', 'The decline of nationalism', 'The immediate improvement in women\'s rights']),
    correctAnswer: 'The growth of an urban industrial working class with poor living conditions',
    explanation: 'Industrialization led to rapid urbanization and the growth of a proletariat (working class) who often labored in dangerous conditions for low wages in urban slums.',
    historicalThinkingSkill: 'Causation', difficulty: 2, timePeriod: '1750-1900',
  })
  await upsertQuestion({
    unitId: u6, type: 'SAQ',
    prompt: 'Briefly explain ONE way in which industrialization changed social structures in Europe between 1750 and 1900.',
    historicalThinkingSkill: 'Causation', difficulty: 3, timePeriod: '1750-1900',
  })
  await upsertQuestion({
    unitId: u6, type: 'SAQ',
    prompt: 'Briefly explain ONE way in which European imperialism affected economies in Asia or Africa between 1750 and 1900.',
    historicalThinkingSkill: 'Causation', difficulty: 3, timePeriod: '1750-1900',
  })
  await upsertQuestion({
    unitId: u6, type: 'LEQ',
    prompt: 'Evaluate the extent to which industrialization led to the expansion of European imperialism in Africa and Asia between 1750 and 1900.',
    historicalThinkingSkill: 'Argumentation', difficulty: 5, timePeriod: '1750-1900',
  })

  // ---------- UNIT 7 QUESTIONS ----------
  const u7 = createdUnits[7].id
  await upsertQuestion({
    unitId: u7, type: 'MCQ',
    prompt: 'The assassination of Archduke Franz Ferdinand in 1914 triggered World War I primarily because:',
    choices: JSON.stringify(['Germany had long planned to invade France', 'It set off a chain reaction among the alliance system', 'Austria-Hungary immediately declared war on all major powers', 'It gave Britain a pretext to attack Germany']),
    correctAnswer: 'It set off a chain reaction among the alliance system',
    explanation: 'The assassination triggered the alliance system: Austria-Hungary declared war on Serbia, Russia mobilized in support of Serbia, Germany declared war on Russia, and France and Britain entered the conflict.',
    historicalThinkingSkill: 'Causation', difficulty: 2, timePeriod: '1900-1945',
  })
  await upsertQuestion({
    unitId: u7, type: 'MCQ',
    prompt: 'The Treaty of Versailles (1919) contributed to the rise of fascism in Germany primarily by:',
    choices: JSON.stringify(['Granting Germany extensive new territories', 'Imposing harsh reparations and humiliating conditions that fostered German resentment', 'Creating a strong democratic government in Germany', 'Establishing the League of Nations with Germany as a founding member']),
    correctAnswer: 'Imposing harsh reparations and humiliating conditions that fostered German resentment',
    explanation: 'The Treaty of Versailles imposed crippling reparations, territorial losses, and the "war guilt" clause on Germany, creating economic hardship and resentment that Hitler exploited.',
    historicalThinkingSkill: 'Causation', difficulty: 2, timePeriod: '1900-1945',
  })
  await upsertQuestion({
    unitId: u7, type: 'MCQ',
    prompt: 'How did World War II fundamentally change the international balance of power?',
    choices: JSON.stringify(['It restored European colonial empires to their pre-war strength', 'It shifted global power from European empires to the United States and Soviet Union', 'It established Japan as the dominant power in Asia', 'It created a unified world government under the United Nations']),
    correctAnswer: 'It shifted global power from European empires to the United States and Soviet Union',
    explanation: 'World War II devastated European powers while elevating the US and USSR as superpowers, establishing the bipolar Cold War world order.',
    historicalThinkingSkill: 'Continuity and Change Over Time', difficulty: 2, timePeriod: '1900-1945',
  })
  await upsertQuestion({
    unitId: u7, type: 'SAQ',
    prompt: 'Briefly explain ONE way in which World War I changed political structures in Europe between 1914 and 1925.',
    historicalThinkingSkill: 'Causation', difficulty: 3, timePeriod: '1900-1945',
  })
  await upsertQuestion({
    unitId: u7, type: 'SAQ',
    prompt: 'Briefly explain ONE way in which the Great Depression contributed to the rise of totalitarian regimes in the 1930s.',
    historicalThinkingSkill: 'Causation', difficulty: 3, timePeriod: '1900-1945',
  })
  await upsertQuestion({
    unitId: u7, type: 'LEQ',
    prompt: 'Evaluate the extent to which nationalism caused the global conflicts of the period 1900-1945.',
    historicalThinkingSkill: 'Argumentation', difficulty: 5, timePeriod: '1900-1945',
  })

  // ---------- UNIT 8 QUESTIONS ----------
  const u8 = createdUnits[8].id
  await upsertQuestion({
    unitId: u8, type: 'MCQ',
    prompt: 'The Marshall Plan (1948) was primarily designed to achieve which US foreign policy goal?',
    choices: JSON.stringify(['To rebuild European economies and prevent the spread of communism', 'To establish US military bases across Western Europe', 'To create a US-led military alliance against the Soviet Union', 'To promote US exports to European markets']),
    correctAnswer: 'To rebuild European economies and prevent the spread of communism',
    explanation: 'The Marshall Plan provided economic aid to rebuild Western European economies devastated by WWII, with the strategic goal of creating stable democracies resistant to communist influence.',
    historicalThinkingSkill: 'Causation', difficulty: 2, timePeriod: '1945-1980',
  })
  await upsertQuestion({
    unitId: u8, type: 'MCQ',
    prompt: 'Which of the following best describes the strategy of non-alignment pursued by many newly independent nations after World War II?',
    choices: JSON.stringify(['Joining NATO to receive US military protection', 'Refusing to join either the US or Soviet bloc while pursuing independent foreign policies', 'Forming military alliances exclusively with other developing nations', 'Adopting communist economic models while rejecting Soviet political control']),
    correctAnswer: 'Refusing to join either the US or Soviet bloc while pursuing independent foreign policies',
    explanation: 'The Non-Aligned Movement, led by figures like Nehru, Nasser, and Tito, sought to maintain independence from both superpowers during the Cold War.',
    historicalThinkingSkill: 'Contextualization', difficulty: 3, timePeriod: '1945-1980',
  })
  await upsertQuestion({
    unitId: u8, type: 'MCQ',
    prompt: 'The decolonization of Africa in the 1960s was primarily accelerated by which factor?',
    choices: JSON.stringify(['Military defeat of European powers by African armies', 'Economic weakness of European powers after WWII combined with African nationalist movements', 'United Nations military intervention', 'Cold War superpowers funding African independence movements equally']),
    correctAnswer: 'Economic weakness of European powers after WWII combined with African nationalist movements',
    explanation: 'Post-WWII European economic weakness, combined with growing African nationalist movements and international pressure, led to rapid decolonization across Africa.',
    historicalThinkingSkill: 'Causation', difficulty: 3, timePeriod: '1945-1980',
  })
  await upsertQuestion({
    unitId: u8, type: 'SAQ',
    prompt: 'Briefly explain ONE way in which the Cold War affected decolonization movements in Asia or Africa between 1945 and 1975.',
    historicalThinkingSkill: 'Causation', difficulty: 3, timePeriod: '1945-1980',
  })
  await upsertQuestion({
    unitId: u8, type: 'SAQ',
    prompt: 'Briefly explain ONE similarity between anti-colonial movements in India and Algeria in the mid-20th century.',
    historicalThinkingSkill: 'Comparison', difficulty: 4, timePeriod: '1945-1980',
  })
  await upsertQuestion({
    unitId: u8, type: 'LEQ',
    prompt: 'Evaluate the extent to which Cold War rivalry between the United States and Soviet Union influenced decolonization movements between 1945 and 1980.',
    historicalThinkingSkill: 'Argumentation', difficulty: 5, timePeriod: '1945-1980',
  })

  // ---------- UNIT 9 QUESTIONS ----------
  const u9 = createdUnits[9].id
  await upsertQuestion({
    unitId: u9, type: 'MCQ',
    prompt: 'The fall of the Berlin Wall in 1989 most directly represented:',
    choices: JSON.stringify(['The beginning of German reunification and the symbolic end of the Cold War', 'The collapse of the Soviet Union', 'The expansion of NATO into Eastern Europe', 'The beginning of European economic integration']),
    correctAnswer: 'The beginning of German reunification and the symbolic end of the Cold War',
    explanation: 'The fall of the Berlin Wall on November 9, 1989 symbolized the collapse of communist regimes in Eastern Europe and paved the way for German reunification in 1990.',
    historicalThinkingSkill: 'Continuity and Change Over Time', difficulty: 2, timePeriod: '1980-present',
  })
  await upsertQuestion({
    unitId: u9, type: 'MCQ',
    prompt: 'Which of the following best describes the role of the World Trade Organization (WTO) in economic globalization?',
    choices: JSON.stringify(['It manages a global central bank', 'It regulates international trade and resolves trade disputes between nations', 'It distributes foreign aid to developing nations', 'It enforces environmental regulations on multinational corporations']),
    correctAnswer: 'It regulates international trade and resolves trade disputes between nations',
    explanation: 'The WTO, established in 1995, provides a framework for negotiating trade agreements and resolving disputes, promoting the liberalization of global trade.',
    historicalThinkingSkill: 'Contextualization', difficulty: 2, timePeriod: '1980-present',
  })
  await upsertQuestion({
    unitId: u9, type: 'MCQ',
    prompt: 'The rise of China as an economic power since the 1980s is best explained by which combination of factors?',
    choices: JSON.stringify(['Communist economic planning and isolation from global markets', 'Market-oriented reforms, foreign investment, and export-led manufacturing growth', 'Military expansion and resource extraction from neighboring states', 'Western foreign aid and democratic political reforms']),
    correctAnswer: 'Market-oriented reforms, foreign investment, and export-led manufacturing growth',
    explanation: 'China\'s economic rise was driven by Deng Xiaoping\'s market reforms beginning in 1978, which attracted foreign investment and built an export-oriented manufacturing economy.',
    historicalThinkingSkill: 'Causation', difficulty: 3, timePeriod: '1980-present',
  })
  await upsertQuestion({
    unitId: u9, type: 'SAQ',
    prompt: 'Briefly explain ONE way in which economic globalization since 1980 has affected developing nations.',
    historicalThinkingSkill: 'Causation', difficulty: 3, timePeriod: '1980-present',
  })
  await upsertQuestion({
    unitId: u9, type: 'SAQ',
    prompt: 'Briefly explain ONE way in which digital technology has changed patterns of cultural exchange since 1980.',
    historicalThinkingSkill: 'Continuity and Change Over Time', difficulty: 3, timePeriod: '1980-present',
  })
  await upsertQuestion({
    unitId: u9, type: 'LEQ',
    prompt: 'Evaluate the extent to which globalization since 1980 has increased global inequality.',
    historicalThinkingSkill: 'Argumentation', difficulty: 5, timePeriod: '1980-present',
  })

  // ---------- RUBRICS ----------
  const dbqRubric = await prisma.rubric.upsert({
    where: { id: 'rubric_dbq_v1' },
    update: {},
    create: {
      id: 'rubric_dbq_v1',
      questionType: 'DBQ',
      version: 1,
      name: 'AP World History DBQ Rubric',
      description: 'Standard College Board rubric for Document-Based Questions',
      criteria: {
        create: [
          { name: 'Thesis/Claim', description: 'Responds to the prompt with a historically defensible thesis/claim that establishes a line of reasoning. Does not simply restate or rephrase the prompt. (1 point)', maxPoints: 1, orderIndex: 1 },
          { name: 'Contextualization', description: 'Describes a broader historical context accurately and connects it to the argument. Must relate the context to the argument, not merely a phrase or reference. (1 point)', maxPoints: 1, orderIndex: 2 },
          { name: 'Evidence - Document Content', description: 'Uses the content of at least three documents to address the topic (1 pt) OR uses the content of at least six documents to support an argument (2 pts)', maxPoints: 2, orderIndex: 3 },
          { name: 'Evidence - Outside Evidence', description: 'Uses at least one piece of evidence not found in the documents that is relevant to an argument about the prompt. (1 point)', maxPoints: 1, orderIndex: 4 },
          { name: 'Analysis - Sourcing', description: 'For at least three documents, explains how or why the document\'s point of view, purpose, historical situation, or audience is relevant to an argument. (1 point)', maxPoints: 1, orderIndex: 5 },
          { name: 'Analysis - Complexity', description: 'Demonstrates a complex understanding of the historical development by analyzing multiple variables or perspectives. (1 point)', maxPoints: 1, orderIndex: 6 },
        ],
      },
    },
  })

  const leqRubric = await prisma.rubric.upsert({
    where: { id: 'rubric_leq_v1' },
    update: {},
    create: {
      id: 'rubric_leq_v1',
      questionType: 'LEQ',
      version: 1,
      name: 'AP World History LEQ Rubric',
      description: 'Standard College Board rubric for Long Essay Questions',
      criteria: {
        create: [
          { name: 'Thesis/Claim', description: 'Responds to the prompt with a historically defensible thesis/claim that establishes a line of reasoning. (1 point)', maxPoints: 1, orderIndex: 1 },
          { name: 'Contextualization', description: 'Describes a broader historical context accurately and connects it to the argument. (1 point)', maxPoints: 1, orderIndex: 2 },
          { name: 'Evidence - Specific', description: 'Provides at least two pieces of specific evidence relevant to the topic (1 pt) OR supports an argument with at least two pieces of specific evidence (2 pts)', maxPoints: 2, orderIndex: 3 },
          { name: 'Analysis - Historical Reasoning', description: 'Uses historical reasoning skill (comparison, causation, or continuity and change) to frame the argument. (1 point)', maxPoints: 1, orderIndex: 4 },
          { name: 'Analysis - Complexity', description: 'Demonstrates a complex understanding of the historical development. (1 point)', maxPoints: 1, orderIndex: 5 },
        ],
      },
    },
  })

  console.log('Seeding complete!')
  console.log(`Created ${Object.keys(createdUnits).length} units`)
  console.log('DBQ Rubric:', dbqRubric.id)
  console.log('LEQ Rubric:', leqRubric.id)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
