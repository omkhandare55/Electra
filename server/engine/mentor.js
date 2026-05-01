'use strict';

/**
 * @fileoverview Education/Mentor engine that provides adaptive election knowledge.
 * Responses adapt to user_level: beginner (analogies), intermediate (structured), advanced (technical).
 * @module engine/mentor
 */

const KNOWLEDGE_BASE = {
  'election process': {
    beginner: {
      explanation: 'An election is like choosing a class monitor — everyone gets one vote, and the person with the most votes wins!',
      steps: [
        '1. Candidates file their nominations (like raising your hand to volunteer)',
        '2. Campaigns happen where candidates explain their plans (like giving a speech in class)',
        '3. Voting day — every eligible citizen casts their vote secretly',
        '4. Votes are counted and the winner is announced'
      ],
      example: 'In India, Lok Sabha elections happen every 5 years. 900+ million voters choose 543 MPs who then form the government.'
    },
    intermediate: {
      explanation: 'Elections are a structured democratic process where citizens choose representatives through secret ballot voting. India uses the First-Past-The-Post (FPTP) system.',
      steps: [
        '1. Election Commission announces dates and code of conduct activates',
        '2. Nomination filing, scrutiny, and withdrawal phase',
        '3. Campaign period with regulated spending and media coverage',
        '4. Polling across multiple phases with EVMs and VVPAT verification',
        '5. Counting day with postal ballots counted first, then EVM results',
        '6. Results declared, winning candidates get certificates'
      ],
      example: 'The 2024 Indian General Election was conducted in 7 phases across 44 days, with the ECI deploying over 15 million officials.'
    },
    advanced: {
      explanation: 'Indian elections operate under the Representation of the People Act, 1950 & 1951. The FPTP system awards seats to plurality winners in single-member constituencies, which can produce disproportionate results compared to vote share.',
      steps: [
        '1. Delimitation Commission defines constituency boundaries based on Census data',
        '2. Electoral rolls prepared using continuous enumeration and special drives',
        '3. Model Code of Conduct (MCC) enforced — quasi-legal convention monitored by ECI',
        '4. Campaign finance regulated under Section 77 of RPA 1951 (₹95L limit for Lok Sabha)',
        '5. Electronic Voting Machines (M3 EVMs) with VVPAT used since 2019 nationwide',
        '6. Anti-defection law (10th Schedule) governs post-election party switching'
      ],
      example: 'In 2024, BJP won 240 seats with ~36.6% vote share while INDIA bloc won 234 seats with ~41.6%, demonstrating FPTP\'s non-proportional outcomes.'
    }
  },
  'campaign strategy': {
    beginner: {
      explanation: 'A campaign strategy is your plan to convince people to vote for you — like planning how to win a game!',
      steps: [
        '1. Know your voters — what problems do they face?',
        '2. Make promises that solve their problems',
        '3. Choose how to reach them — social media, rallies, or going door-to-door',
        '4. Spend your budget wisely on what works best'
      ],
      example: 'If you\'re in a village, going door-to-door works better than Instagram ads. If targeting youth in cities, social media is king!'
    },
    intermediate: {
      explanation: 'Campaign strategy involves segmenting voters, crafting targeted messaging, selecting optimal communication channels, and allocating resources for maximum electoral impact.',
      steps: [
        '1. Voter segmentation — analyze demographics, caste dynamics, and local issues',
        '2. Message development — create a clear, memorable narrative (e.g., "Acche Din")',
        '3. Channel selection — match communication medium to audience behavior',
        '4. Ground game — build booth-level worker networks for GOTV (Get Out The Vote)',
        '5. Budget allocation — distribute resources across advertising, events, and grassroots',
        '6. Opposition research — prepare responses to competitor narratives'
      ],
      example: 'AAP\'s 2020 Delhi campaign focused on "kaam ki rajneeti" (politics of work) with targeted social media for urban voters and mohalla sabhas for direct engagement.'
    },
    advanced: {
      explanation: 'Modern Indian campaigns employ data-driven micro-targeting, psychographic profiling, and multi-channel attribution modeling. The shift from mass media to digital-first strategies has transformed electoral calculus.',
      steps: [
        '1. Data analytics — use booth-level past results, demographic overlays, and survey data',
        '2. Micro-targeting — craft segment-specific messages using NLP-generated content',
        '3. Digital strategy — WhatsApp forward chains, YouTube pre-rolls, Instagram reels with A/B testing',
        '4. Ground operations — shakti kendra model with real-time reporting via mobile apps',
        '5. Media management — prime-time TV debates, press conferences, narrative framing',
        '6. Alliance arithmetic — coalition seat-sharing based on complementary vote banks',
        '7. Last-mile mobilization — caste/community-specific outreach in final 72 hours'
      ],
      example: 'BJP\'s 2014 campaign used 3D hologram rallies, a dedicated war room analyzing 600+ social media data points daily, and a missed-call campaign that collected 17 crore phone numbers.'
    }
  },
  'voting systems': {
    beginner: {
      explanation: 'A voting system is the set of rules for how votes turn into winners — like deciding if the class monitor needs the most votes or more than half!',
      steps: [
        '1. FPTP (First Past The Post) — whoever gets the most votes wins. India uses this!',
        '2. Proportional — parties get seats based on their percentage of votes',
        '3. Ranked choice — you rank candidates 1st, 2nd, 3rd and votes transfer'
      ],
      example: 'India uses FPTP: in a 3-way race, someone can win with just 34% of votes if the other two split the rest!'
    },
    intermediate: {
      explanation: 'Voting systems determine how individual preferences aggregate into collective decisions. Each system creates different incentives for parties and voters.',
      steps: [
        '1. FPTP — Simple plurality wins; encourages two-party dominance (Duverger\'s law)',
        '2. Proportional Representation — Seats match vote share; used in Rajya Sabha indirectly',
        '3. Mixed systems — Combine FPTP and PR (Germany\'s MMP system)',
        '4. STV (Single Transferable Vote) — Used for Indian presidential elections',
        '5. Anti-defection provisions affect how voting systems play out post-election'
      ],
      example: 'Rajya Sabha uses STV with open ballot, while Lok Sabha uses FPTP with secret ballot — different systems for different chambers.'
    },
    advanced: {
      explanation: 'Electoral system design involves trade-offs between proportionality, accountability, stability, and simplicity. Arrow\'s impossibility theorem proves no ranked voting system satisfies all fairness criteria simultaneously.',
      steps: [
        '1. FPTP creates manufactured majorities — seat bonus for largest party',
        '2. Effective Number of Parties (ENP) = 1/Σ(pi²) measures fragmentation',
        '3. Gallagher index measures disproportionality between votes and seats',
        '4. Strategic voting (Duverger effect) vs sincere preference expression',
        '5. Gerrymandering risks in single-member districts vs. multi-member alternatives',
        '6. Condorcet criterion and its implications for ranked-choice methods'
      ],
      example: 'India\'s 2024 elections had a Gallagher index of ~17.5, indicating significant disproportionality. FPTP gave the winning alliance 293/543 seats (54%) with ~43% votes.'
    }
  },
  'election commission': {
    beginner: {
      explanation: 'The Election Commission is like the referee of elections — they make sure everyone plays fair!',
      steps: [
        '1. They decide when elections happen',
        '2. They make rules all parties must follow',
        '3. They set up voting booths everywhere — even remote mountain villages',
        '4. They count votes and announce results'
      ],
      example: 'The Election Commission of India once set up a polling booth for just ONE voter in the Gir forest, Gujarat — that\'s dedication to democracy!'
    },
    intermediate: {
      explanation: 'The Election Commission of India (ECI) is an autonomous constitutional body (Article 324) responsible for administering elections to Parliament, State Legislatures, and offices of President and Vice-President.',
      steps: [
        '1. Structure: CEC + 2 Election Commissioners, appointed by the President',
        '2. Enforces Model Code of Conduct during election period',
        '3. Manages electoral rolls with continuous enumeration',
        '4. Controls election symbols and party registration',
        '5. Monitors campaign spending via expenditure observers',
        '6. Deploys central forces and oversees EVM/VVPAT logistics'
      ],
      example: 'For 2024 elections, ECI deployed 5.5 million EVMs, 55 lakh polling officials, and established over 10 lakh polling stations.'
    },
    advanced: {
      explanation: 'The ECI derives power from Article 324 of the Constitution, with quasi-judicial authority over election disputes during the process. Its independence has been debated, leading to the 2023 SC judgment mandating a selection committee for appointments.',
      steps: [
        '1. Constitutional status: Art 324-329 define powers; removal only via impeachment-like process for CEC',
        '2. SC ruling in Anoop Baranwal v. UOI (2023) — selection committee of PM, LoP, and CJI',
        '3. MCC is convention-based, not statutory — enforced through executive power and moral authority',
        '4. Expenditure monitoring uses cVIGIL app, shadow observation registers, and flying squads',
        '5. Voter Verifiable Paper Audit Trail (VVPAT) mandatory since 2019; SC ordered 5-machine verification per constituency',
        '6. NOTA option added after PUCL v. UOI (2013) judgment'
      ],
      example: 'The ECI\'s autonomy was tested when T.N. Seshan (CEC 1990-96) enforced MCC strictly for the first time, transforming Indian elections from violence-prone to largely orderly processes.'
    }
  },
  'political parties': {
    beginner: {
      explanation: 'Political parties are groups of people who share similar ideas about how to run the country — like teams in a debate competition!',
      steps: [
        '1. People with similar views form a party',
        '2. The party picks candidates for each area',
        '3. They campaign together with shared promises',
        '4. If they win enough seats, they form the government'
      ],
      example: 'India has 6 national parties (BJP, INC, BSP, CPI, CPI-M, NCP) and over 50 state parties. That\'s a lot of teams!'
    },
    intermediate: {
      explanation: 'Political parties in India are registered under Section 29A of the RPA 1951. They are classified as national (≥6% votes in 4+ states) or state parties (≥6% votes or 2 seats in a state).',
      steps: [
        '1. Registration with ECI under RPA 1951 Section 29A',
        '2. Classification criteria: national, state, or registered unrecognized',
        '3. Symbol allocation — reserved symbols for recognized parties, free symbols for others',
        '4. Coalition dynamics — pre-poll vs post-poll alliances',
        '5. Inner-party democracy requirements and candidate selection processes',
        '6. Financial disclosure — parties must file IT returns and disclose donations >₹20,000'
      ],
      example: 'The NDA and INDIA blocs in 2024 represented two major coalition frameworks, with 38+ parties across both alliances.'
    },
    advanced: {
      explanation: 'Indian party systems have evolved through four distinct party systems: Congress dominance (1952-77), Congress system breakdown (1977-89), coalition era (1989-2014), and BJP dominance (2014-present). Rajni Kothari\'s "Congress system" thesis and Yogendra Yadav\'s "third electoral system" framework provide theoretical lenses.',
      steps: [
        '1. Electoral bonds (2018-2024) — SC struck down in ADR v. UOI (Feb 2024)',
        '2. Anti-defection (10th Schedule) — Kihoto Hollohan precedent and recent Maharashtra/Shiv Sena split',
        '3. VVPAT and transparency demands — ongoing litigation and civil society advocacy',
        '4. Regionalization of party system measured by effective number of state-level parties',
        '5. Candidate criminalization — ADR data shows 46% MPs in 18th Lok Sabha have criminal cases',
        '6. Internal party elections — largely pro forma; dynastic succession remains common'
      ],
      example: 'The 2024 Maharashtra crisis demonstrated how anti-defection law loopholes (2/3 merger exception) can be exploited, with both Shiv Sena and NCP factions claiming legitimacy through ECI symbol allocation.'
    }
  }
};

/**
 * Generates mentor response based on question and user level.
 * @param {string} question - User's learning question
 * @param {string} userLevel - beginner/intermediate/advanced
 * @returns {Object} Structured educational response
 */
function mentorResponse(question, userLevel = 'beginner') {
  const level = ['beginner', 'intermediate', 'advanced'].includes(userLevel) ? userLevel : 'beginner';
  const normalizedQ = question.toLowerCase().trim();

  // Find matching topic
  let matchedTopic = null;
  let bestMatchScore = 0;

  for (const topic of Object.keys(KNOWLEDGE_BASE)) {
    const keywords = topic.split(' ');
    let score = 0;
    for (const kw of keywords) {
      if (normalizedQ.includes(kw)) score++;
    }
    if (score > bestMatchScore) {
      bestMatchScore = score;
      matchedTopic = topic;
    }
  }

  // Fallback keyword matching
  if (!matchedTopic) {
    const keywordMap = {
      'vote': 'election process', 'voting': 'voting systems', 'ballot': 'voting systems',
      'evm': 'election commission', 'eci': 'election commission', 'commission': 'election commission',
      'campaign': 'campaign strategy', 'strategy': 'campaign strategy', 'rally': 'campaign strategy',
      'party': 'political parties', 'parties': 'political parties', 'bjp': 'political parties',
      'congress': 'political parties', 'coalition': 'political parties', 'alliance': 'political parties',
      'elect': 'election process', 'democracy': 'election process', 'fptp': 'voting systems',
      'proportional': 'voting systems', 'nomination': 'election process'
    };
    for (const [kw, topic] of Object.entries(keywordMap)) {
      if (normalizedQ.includes(kw)) { matchedTopic = topic; break; }
    }
  }

  if (!matchedTopic) {
    return {
      topic: 'general',
      level: level,
      response: 'I can help you learn about: Election Process, Campaign Strategy, Voting Systems, Election Commission, and Political Parties. Try asking about any of these topics!',
      available_topics: Object.keys(KNOWLEDGE_BASE)
    };
  }

  const content = KNOWLEDGE_BASE[matchedTopic][level];
  return {
    topic: matchedTopic,
    level: level,
    explanation: content.explanation,
    steps: content.steps,
    real_world_example: content.example,
    available_topics: Object.keys(KNOWLEDGE_BASE)
  };
}

/** Returns list of all available topics */
function getAvailableTopics() {
  return Object.keys(KNOWLEDGE_BASE);
}

module.exports = { mentorResponse, getAvailableTopics, KNOWLEDGE_BASE };
