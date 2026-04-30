/**
 * Training data for the Naive Bayes sentiment classifier.
 *
 * Each entry is a [text, label] pair where label is one of:
 *   'positive', 'neutral', 'negative'
 *
 * The data is specific to faculty evaluation feedback in a
 * Philippine State University (PSU) context.
 */
const trainingData = [
  // ═══════════════════════════════════════════════════════════════
  // POSITIVE  (~60 examples)
  // ═══════════════════════════════════════════════════════════════

  // Teaching quality
  ['The instructor explains concepts clearly and effectively', 'positive'],
  ['Very knowledgeable about the subject matter', 'positive'],
  ['Excellent teaching methodology and approach', 'positive'],
  ['The professor makes complex topics easy to understand', 'positive'],
  ['Great at breaking down difficult concepts', 'positive'],
  ['Uses real-world examples that help us learn', 'positive'],
  ['The lessons are well-prepared and organized', 'positive'],
  ['Always comes to class prepared with materials', 'positive'],
  ['Best teacher I have ever had in this university', 'positive'],
  ['Truly passionate about teaching and it shows', 'positive'],
  ['Makes the subject interesting and engaging', 'positive'],
  ['Clear and concise explanations during lectures', 'positive'],
  ['The instructor is a very effective communicator', 'positive'],
  ['Very good at explaining lessons in a simple way', 'positive'],
  ['Always provides relevant examples and illustrations', 'positive'],

  // Engagement & interaction
  ['The class is always fun and interactive', 'positive'],
  ['Encourages student participation and questions', 'positive'],
  ['Creates a positive and inclusive learning environment', 'positive'],
  ['Very engaging and keeps us interested throughout', 'positive'],
  ['Uses creative activities to make learning enjoyable', 'positive'],
  ['The instructor makes everyone feel welcome to ask questions', 'positive'],
  ['I always look forward to attending this class', 'positive'],
  ['Group activities are well designed and helpful', 'positive'],
  ['Interactive discussions make the class lively', 'positive'],
  ['Never a boring moment in class', 'positive'],

  // Approachability & support
  ['Very approachable and friendly to students', 'positive'],
  ['Always available for consultation and guidance', 'positive'],
  ['Helpful and supportive when students have difficulties', 'positive'],
  ['The instructor genuinely cares about student learning', 'positive'],
  ['Kind and patient with struggling students', 'positive'],
  ['Very accommodating and understanding', 'positive'],
  ['Always willing to help outside of class hours', 'positive'],
  ['Treats all students with respect and fairness', 'positive'],
  ['Gives encouragement and motivates us to do better', 'positive'],
  ['The professor is very considerate of student needs', 'positive'],

  // Feedback & grading
  ['Provides clear and constructive feedback on our work', 'positive'],
  ['Fair and transparent grading system', 'positive'],
  ['Returns graded papers and exams promptly', 'positive'],
  ['The grading criteria are clear and reasonable', 'positive'],
  ['Gives detailed feedback that helps us improve', 'positive'],
  ['Very fair when it comes to grades and assessments', 'positive'],

  // Professionalism
  ['Very professional and dedicated instructor', 'positive'],
  ['Always on time and well organized', 'positive'],
  ['The instructor is a role model for students', 'positive'],
  ['Demonstrates mastery of the subject', 'positive'],
  ['Very responsible and committed to teaching', 'positive'],
  ['Manages class time efficiently', 'positive'],
  ['Well-structured course from start to finish', 'positive'],

  // General positive
  ['Excellent professor overall', 'positive'],
  ['One of the best instructors in the department', 'positive'],
  ['Highly recommend this teacher', 'positive'],
  ['Outstanding performance as an educator', 'positive'],
  ['I learned a lot from this instructor', 'positive'],
  ['Great teacher who truly inspires students', 'positive'],
  ['Very satisfied with the teaching quality', 'positive'],
  ['The instructor exceeded my expectations', 'positive'],
  ['Amazing professor and wonderful person', 'positive'],
  ['Thank you for being such a great mentor', 'positive'],

  // ═══════════════════════════════════════════════════════════════
  // NEGATIVE  (~60 examples)
  // ═══════════════════════════════════════════════════════════════

  // Teaching quality issues
  ['The instructor is unclear and hard to follow', 'negative'],
  ['Lessons are confusing and poorly explained', 'negative'],
  ['Does not explain the topics well', 'negative'],
  ['Very difficult to understand the lectures', 'negative'],
  ['Teaching method is ineffective and outdated', 'negative'],
  ['The instructor just reads from the slides', 'negative'],
  ['No real teaching happens in this class', 'negative'],
  ['Cannot explain concepts in a way students understand', 'negative'],
  ['The professor is not knowledgeable about the subject', 'negative'],
  ['Poorly prepared for class most of the time', 'negative'],
  ['Lessons lack structure and organization', 'negative'],
  ['The instructor does not use any visual aids or examples', 'negative'],
  ['Very bad at explaining even basic concepts', 'negative'],
  ['The teacher seems lost during lectures', 'negative'],
  ['Instruction quality is very poor', 'negative'],

  // Pacing issues
  ['The instructor talks too fast', 'negative'],
  ['Rushes through topics without checking understanding', 'negative'],
  ['Pacing is too quick for students to keep up', 'negative'],
  ['Moves on to new topics before we understand the current one', 'negative'],
  ['The pace of the class is overwhelming', 'negative'],

  // Engagement issues
  ['The class is boring and unengaging', 'negative'],
  ['Monotone delivery puts students to sleep', 'negative'],
  ['No effort to make the class interesting', 'negative'],
  ['The instructor does not encourage participation', 'negative'],
  ['Very dull and uninteresting lectures', 'negative'],
  ['There is no interaction or discussion in class', 'negative'],
  ['The class feels like a waste of time', 'negative'],
  ['Sitting in class feels like a punishment', 'negative'],

  // Professionalism issues
  ['The instructor is always late to class', 'negative'],
  ['Frequently absent without notice', 'negative'],
  ['Cancels class too often without replacement', 'negative'],
  ['Does not respect class schedule or time', 'negative'],
  ['Very unprofessional behavior in class', 'negative'],
  ['The instructor uses phone during class time', 'negative'],
  ['Does not take teaching responsibilities seriously', 'negative'],

  // Fairness & respect issues
  ['Unfair grading and biased treatment of students', 'negative'],
  ['Shows favoritism towards certain students', 'negative'],
  ['The instructor is rude and disrespectful', 'negative'],
  ['Makes students feel stupid for asking questions', 'negative'],
  ['Very intimidating and unapproachable', 'negative'],
  ['Does not treat students equally', 'negative'],
  ['The teacher is arrogant and dismissive', 'negative'],
  ['Discourages students from asking questions', 'negative'],
  ['Grades seem arbitrary and inconsistent', 'negative'],
  ['No transparency in how grades are computed', 'negative'],

  // Feedback & support issues
  ['Never returns graded papers or gives feedback', 'negative'],
  ['Takes too long to return grades', 'negative'],
  ['No constructive feedback on assignments', 'negative'],
  ['The instructor is never available for consultation', 'negative'],
  ['Does not care about student performance', 'negative'],
  ['Ignores student concerns and questions', 'negative'],

  // General negative
  ['Worst instructor I have ever had', 'negative'],
  ['Very disappointed with this teacher', 'negative'],
  ['Would not recommend this instructor', 'negative'],
  ['Terrible teaching experience overall', 'negative'],
  ['I did not learn anything from this class', 'negative'],
  ['This instructor should not be teaching', 'negative'],
  ['Extremely dissatisfied with the course', 'negative'],
  ['The instructor needs serious improvement', 'negative'],

  // ═══════════════════════════════════════════════════════════════
  // NEUTRAL  (~30 examples)
  // ═══════════════════════════════════════════════════════════════

  ['The class was okay', 'neutral'],
  ['Nothing special about the teaching', 'neutral'],
  ['Average instructor with average performance', 'neutral'],
  ['The course was fine I guess', 'neutral'],
  ['The class is just normal', 'neutral'],
  ['Neither good nor bad overall', 'neutral'],
  ['The instructor is okay but could improve', 'neutral'],
  ['Some lessons are good and some are not', 'neutral'],
  ['Acceptable teaching quality', 'neutral'],
  ['The class meets basic expectations', 'neutral'],
  ['It was an ordinary class experience', 'neutral'],
  ['The instructor is decent', 'neutral'],
  ['The course was standard nothing remarkable', 'neutral'],
  ['Sometimes good sometimes not', 'neutral'],
  ['There are areas for improvement but also good points', 'neutral'],
  ['The teacher is not bad but not great either', 'neutral'],
  ['Mixed feelings about this course', 'neutral'],
  ['The instructor has both strengths and weaknesses', 'neutral'],
  ['Regular class nothing to complain about', 'neutral'],
  ['Just a typical class experience', 'neutral'],
  ['Some topics were taught well others not so much', 'neutral'],
  ['I have no strong feelings about this class', 'neutral'],
  ['The instructor does an adequate job', 'neutral'],
  ['It was a mediocre experience overall', 'neutral'],
  ['The class is passable', 'neutral'],
  ['Not the best but not the worst either', 'neutral'],
  ['The instructor was alright', 'neutral'],
  ['No comments', 'neutral'],
  ['None', 'neutral'],
  ['N/A', 'neutral'],

  // ═══════════════════════════════════════════════════════════════
  // ADDITIONAL EXAMPLES  (improve accuracy on edge cases)
  // ═══════════════════════════════════════════════════════════════

  // More negative — short phrases & professionalism
  ['Always late', 'negative'],
  ['Always late and unprepared', 'negative'],
  ['Late and unprepared for class', 'negative'],
  ['Never on time', 'negative'],
  ['Unprepared and disorganized', 'negative'],
  ['Not prepared', 'negative'],
  ['Lazy instructor', 'negative'],
  ['Does not care', 'negative'],
  ['Very rude', 'negative'],
  ['Disrespectful to students', 'negative'],
  ['Not helpful at all', 'negative'],
  ['Cannot teach', 'negative'],
  ['Bad teacher', 'negative'],
  ['Poor teaching', 'negative'],
  ['Very disappointing', 'negative'],
  ['Waste of time', 'negative'],
  ['Terrible', 'negative'],
  ['Awful experience', 'negative'],
  ['The worst', 'negative'],
  ['Unacceptable behavior', 'negative'],
  ['No effort from the instructor', 'negative'],
  ['Very slow to return grades and feedback', 'negative'],
  ['Does not listen to students', 'negative'],
  ['Makes the subject harder than it should be', 'negative'],
  ['The instructor clearly does not want to teach', 'negative'],

  // More positive — short phrases
  ['Very good', 'positive'],
  ['Excellent', 'positive'],
  ['Amazing teacher', 'positive'],
  ['Best professor', 'positive'],
  ['Very helpful', 'positive'],
  ['Great instructor', 'positive'],
  ['Well prepared', 'positive'],
  ['Always on time and ready', 'positive'],
  ['Highly knowledgeable', 'positive'],
  ['Super engaging', 'positive'],
  ['Really good at teaching', 'positive'],
  ['Love this class', 'positive'],
  ['Learned so much', 'positive'],
  ['The best teacher ever', 'positive'],
  ['Very inspiring and motivating', 'positive'],
  ['Clear explanations and good examples', 'positive'],
  ['Made difficult topics easy', 'positive'],
  ['Fun and educational at the same time', 'positive'],
  ['I wish all teachers were like this', 'positive'],
  ['The instructor truly cares about us', 'positive'],

  // More neutral
  ['Okay lang', 'neutral'],
  ['So so', 'neutral'],
  ['Fair enough', 'neutral'],
  ['Could be better could be worse', 'neutral'],
  ['Moderate performance', 'neutral'],
  ['Not bad', 'neutral'],
  ['It was fine', 'neutral'],
  ['Nothing much to say', 'neutral'],
  ['No complaints but nothing impressive', 'neutral'],
  ['The class was average', 'neutral'],

  // Mixed-sentiment (positive + negative = neutral)
  ['Helpful but boring', 'neutral'],
  ['The instructor is kind but the lectures are confusing', 'neutral'],
  ['Good teacher but always late to class', 'neutral'],
  ['Knowledgeable but not engaging', 'neutral'],
  ['Nice person but bad at explaining', 'neutral'],
  ['The professor knows the subject but cannot teach it well', 'neutral'],
  ['Friendly but disorganized', 'neutral'],
  ['Patient with students but the lessons are unclear', 'neutral'],
  ['Well prepared but the class is still boring', 'neutral'],
  ['Grades fairly but does not explain well', 'neutral'],
  ['Approachable but lectures are too fast', 'neutral'],
  ['Caring instructor but poor time management', 'neutral'],
  ['Great personality but needs to improve teaching', 'neutral'],
  ['The instructor is helpful but boring', 'neutral'],
  ['Respectful but ineffective teaching style', 'neutral'],
  ['Good at theory but bad at practical examples', 'neutral'],
  ['Sometimes great sometimes terrible', 'neutral'],
  ['Has good days and bad days in teaching', 'neutral'],
  ['Strong in content but weak in delivery', 'neutral'],
  ['The teacher tries hard but students still struggle', 'neutral'],

  // Reinforcement — pure negatives (rebalance after mixed-neutral additions)
  ['Boring lectures every single day', 'negative'],
  ['Unclear and confusing all the time', 'negative'],
  ['The lectures are boring and hard to follow', 'negative'],
  ['Confusing explanations with no examples', 'negative'],
  ['Class is always boring nothing interesting', 'negative'],
  ['Unclear instructions on assignments and exams', 'negative'],
  ['The instructor is terrible at teaching', 'negative'],
  ['Completely boring and waste of time', 'negative'],
  ['Late unprepared and does not care about students', 'negative'],
  ['The class is so boring I want to drop it', 'negative'],
  ['Disorganized boring and ineffective', 'negative'],
  ['Lectures are unclear and poorly delivered', 'negative'],

  // Negation phrases (bigram support — "not X" = negative)
  ['Not clear', 'negative'],
  ['Not helpful', 'negative'],
  ['Not good', 'negative'],
  ['Not prepared', 'negative'],
  ['Not organized', 'negative'],
  ['Not engaging', 'negative'],
  ['Not effective', 'negative'],
  ['Not professional', 'negative'],
  ['Not fair', 'negative'],
  ['Not recommended', 'negative'],
  ['The instructor is not clear at all', 'negative'],
  ['Explanations are not clear', 'negative'],
  ['The teacher is not helpful', 'negative'],
  ['Teaching is not effective', 'negative'],
  ['The instructor is not good at explaining', 'negative'],
  ['Not a good teacher', 'negative'],
  ['The class is not interesting', 'negative'],
  ['Not well organized', 'negative'],
  ['The grading is not fair', 'negative'],
  ['Does not explain clearly', 'negative'],

  // Double negatives ("not" + negative word = positive/neutral)
  ['Not bad', 'neutral'],
  ['Not bad at all', 'positive'],
  ['Not boring', 'positive'],
  ['The instructor is not bad', 'neutral'],
  ['The class is not boring', 'positive'],
  ['Not the worst teacher', 'neutral'],
  ['Not terrible', 'neutral'],
  ['Not disappointing', 'positive'],
  ['The instructor is not rude', 'positive'],
  ['Not unfair', 'positive'],
  ['Not disorganized', 'positive'],
  ['Not unprepared', 'positive'],
  ['The class was not boring at all', 'positive'],
  ['Teaching is not bad actually', 'positive'],

  // ═══════════════════════════════════════════════════════════════
  // FILIPINO & TAGLISH (Tagalog-English mix)
  // ═══════════════════════════════════════════════════════════════

  // ── Filipino/Taglish POSITIVE ─────────────────────────────────
  ['Magaling mag-turo si sir', 'positive'],
  ['Magaling mag-explain ng lessons', 'positive'],
  ['Napaka-galing ng professor namin', 'positive'],
  ['Ang galing galing niya magturo', 'positive'],
  ['Sobrang galing ng teacher namin', 'positive'],
  ['Ang husay ng pagtuturo niya', 'positive'],
  ['Napakahusay ng instructor', 'positive'],
  ['Masaya mag-aral sa class niya', 'positive'],
  ['Ang saya ng klase niya', 'positive'],
  ['Sobrang saya ng class namin', 'positive'],
  ['Nakakatuwa yung mga activities', 'positive'],
  ['Ang dami kong natutunan sa class niya', 'positive'],
  ['Marami akong natutunan', 'positive'],
  ['Natuto talaga ako sa kanya', 'positive'],
  ['Ang gaan ng pagtuturo niya', 'positive'],
  ['Madali niya i-explain yung lessons', 'positive'],
  ['Sobrang clear ng explanation niya', 'positive'],
  ['Ang linaw ng discussion niya', 'positive'],
  ['Very approachable si maam', 'positive'],
  ['Mabait si sir at helpful', 'positive'],
  ['Sobrang bait ng teacher namin', 'positive'],
  ['Napaka-approachable at kind', 'positive'],
  ['Maalaga sa students', 'positive'],
  ['May pagmamalasakit sa mga estudyante', 'positive'],
  ['Always nag-eeffort si sir para sa amin', 'positive'],
  ['Lagi siyang prepared sa class', 'positive'],
  ['On time lagi si maam', 'positive'],
  ['Napaka-organized ng class niya', 'positive'],
  ['Fair mag-grade si sir', 'positive'],
  ['Super helpful at patient', 'positive'],
  ['Best teacher ever si maam', 'positive'],
  ['Ang galing talaga love ko yung class', 'positive'],
  ['Solid yung pagtuturo niya', 'positive'],
  ['Astig mag-turo si sir', 'positive'],

  // ── Filipino/Taglish NEGATIVE ─────────────────────────────────
  ['Hindi marunong magturo', 'negative'],
  ['Hindi magaling mag-explain', 'negative'],
  ['Ang pangit ng pagtuturo', 'negative'],
  ['Sobrang boring ng class', 'negative'],
  ['Ang boring ng klase niya', 'negative'],
  ['Nakakaantok yung discussion', 'negative'],
  ['Walang kwenta yung class', 'negative'],
  ['Walang natutunan sa klase', 'negative'],
  ['Hindi ko maintindihan yung lessons', 'negative'],
  ['Hindi malinaw ang explanation', 'negative'],
  ['Ang labo ng turo niya', 'negative'],
  ['Sobrang labo ng discussion', 'negative'],
  ['Magulo yung lesson', 'negative'],
  ['Ang hirap intindihin ng turo niya', 'negative'],
  ['Laging late si sir', 'negative'],
  ['Lagi siyang absent', 'negative'],
  ['Palaging late at walang pake', 'negative'],
  ['Hindi pumapasok minsan', 'negative'],
  ['Bastos yung teacher', 'negative'],
  ['Ang sama ng ugali ng instructor', 'negative'],
  ['Masungit at hindi approachable', 'negative'],
  ['May favoritism sa ibang students', 'negative'],
  ['Hindi fair mag-grade', 'negative'],
  ['Unfair ang grading system niya', 'negative'],
  ['Walang feedback sa mga assignments', 'negative'],
  ['Ang tagal mag-return ng grades', 'negative'],
  ['Sobrang strict at hindi makatao', 'negative'],
  ['Hindi siya nakikinig sa students', 'negative'],
  ['Parang ayaw niya magturo', 'negative'],
  ['Ang pangit ng experience sa class niya', 'negative'],
  ['Worst teacher ko ever', 'negative'],
  ['Nakakadismaya yung klase', 'negative'],
  ['Ang hirap mag-aral sa kanya', 'negative'],
  ['Tamad magturo', 'negative'],

  // ── Filipino/Taglish NEUTRAL ──────────────────────────────────
  ['Okay lang naman si sir', 'neutral'],
  ['Pwede na', 'neutral'],
  ['Okay naman yung class', 'neutral'],
  ['Sakto lang', 'neutral'],
  ['Ayos naman', 'neutral'],
  ['Hindi naman masama pero hindi rin magaling', 'neutral'],
  ['Katamtaman lang', 'neutral'],
  ['So-so lang yung pagtuturo', 'neutral'],
  ['Pwede pa naman i-improve', 'neutral'],
  ['Wala naman akong masabi', 'neutral'],
  ['Wala lang', 'neutral'],
  ['Minsan okay minsan hindi', 'neutral'],
  ['May mga araw na magaling may mga araw na hindi', 'neutral'],
  ['Average naman ang teacher', 'neutral'],
  ['Goods naman', 'neutral'],

  // ── Filipino/Taglish MIXED (positive + negative = neutral) ────
  ['Magaling magturo pero laging late', 'neutral'],
  ['Mabait si sir pero boring yung class', 'neutral'],
  ['Mahusay pero hindi approachable', 'neutral'],
  ['Magaling pero masungit', 'neutral'],
  ['Knowledgeable si maam pero ang bilis magturo', 'neutral'],
  ['Okay naman si sir pero minsan confusing', 'neutral'],
  ['Prepared lagi pero boring yung delivery', 'neutral'],
  ['Fair mag-grade pero hindi malinaw magturo', 'neutral'],
  ['Patient pero hindi engaging yung class', 'neutral'],
  ['Mabait pero walang natututunan', 'neutral'],

  // ── Filipino/Taglish NEGATION (hindi + positive = negative) ───
  ['Hindi malinaw', 'negative'],
  ['Hindi helpful', 'negative'],
  ['Hindi magaling', 'negative'],
  ['Hindi organized', 'negative'],
  ['Hindi prepared', 'negative'],
  ['Hindi clear ang explanation', 'negative'],
  ['Hindi engaging ang class', 'negative'],
  ['Hindi fair ang grading', 'negative'],

  // ── Filipino/Taglish DOUBLE NEGATIVE (hindi + negative = positive/neutral)
  ['Hindi naman masama', 'neutral'],
  ['Hindi naman boring', 'positive'],
  ['Hindi siya masungit', 'positive'],
  ['Hindi naman pangit magturo', 'neutral'],
  ['Hindi naman nakakaantok', 'positive'],
  ['Hindi siya bastos', 'positive'],

  // ── Reinforcement — commonly missed Filipino words ────────────
  // "magaling" reinforcement (positive)
  ['Magaling siya magturo', 'positive'],
  ['Magaling magturo', 'positive'],
  ['Magaling ang teacher', 'positive'],
  ['Magaling si sir sa pagtuturo', 'positive'],
  ['Sobrang magaling magturo ni sir', 'positive'],
  ['Magaling talaga siya', 'positive'],

  // "walang kwenta" / "walang" reinforcement (negative)
  ['Walang kwenta', 'negative'],
  ['Walang kwenta ang klase', 'negative'],
  ['Walang kwenta ang turo niya', 'negative'],
  ['Walang natutunan sa kanya', 'negative'],
  ['Walang silbi yung class', 'negative'],
  ['Wala akong natutunan', 'negative'],

  // "laging late" reinforcement (negative)
  ['Laging late', 'negative'],
  ['Late lagi', 'negative'],
  ['Laging late sa class', 'negative'],
  ['Palaging late ang instructor', 'negative'],
  ['Late palagi si sir sa klase', 'negative'],

  // "labo" reinforcement (negative)
  ['Ang labo', 'negative'],
  ['Malabo magturo', 'negative'],
  ['Labo ng explanation', 'negative'],
  ['Ang labo ng turo', 'negative'],
  ['Malabo ang pagtuturo niya', 'negative'],
  ['Ang labo ng lesson niya', 'negative'],
  ['Sobrang labo', 'negative'],

  // ── Reinforcement round 2 — from accuracy test misses ─────────

  // English: "dull", "repetitive", "every time" (negative)
  ['Dull and repetitive lectures', 'negative'],
  ['The class is so dull', 'negative'],
  ['Very dull teaching style', 'negative'],
  ['Repetitive lessons every day', 'negative'],
  ['So repetitive and boring', 'negative'],

  // English: "unprepared" standalone (negative)
  ['Comes to class unprepared', 'negative'],
  ['The teacher is unprepared', 'negative'],
  ['Unprepared for every class', 'negative'],
  ['Always unprepared', 'negative'],

  // English: "worst" reinforcement (negative)
  ['The worst experience', 'negative'],
  ['Worst class ever', 'negative'],
  ['The worst professor in the school', 'negative'],
  ['This is the worst class', 'negative'],

  // English: "could not understand" (negative)
  ['Could not understand the lessons', 'negative'],
  ['Could not follow the discussion', 'negative'],
  ['Students could not understand anything', 'negative'],
  ['I could not learn anything', 'negative'],

  // English: "not effective" / "not a very" (negative)
  ['Not effective at teaching', 'negative'],
  ['Not a very good teacher', 'negative'],
  ['Not a very clear instructor', 'negative'],
  ['Not very organized or prepared', 'negative'],

  // English: "clearly" / "so clearly" (positive)
  ['Explains topics clearly', 'positive'],
  ['She explains so clearly', 'positive'],
  ['Everything was explained clearly', 'positive'],
  ['Very clearly explained lessons', 'positive'],
  ['The instructor explains clearly every time', 'positive'],

  // English: "decent" / "room for improvement" (neutral)
  ['Decent but not exceptional', 'neutral'],
  ['Decent instructor overall', 'neutral'],
  ['Has room for improvement', 'neutral'],
  ['Room for growth as a teacher', 'neutral'],

  // Filipino: "enjoy" / "natutunan" / "masaya" (positive)
  ['Sobrang enjoy', 'positive'],
  ['Enjoy ang klase', 'positive'],
  ['Nag-enjoy ako sa class', 'positive'],
  ['Sobrang enjoy ko ang subject', 'positive'],
  ['Ang laki ng natutunan ko', 'positive'],
  ['Malaki ang natutunan namin', 'positive'],
  ['Dami kong natutunan dito', 'positive'],
  ['Masaya at maraming natutunan', 'positive'],
  ['Masayang klase', 'positive'],
  ['Masaya ang klase niya', 'positive'],

  // Filipino: "katamtaman" (neutral)
  ['Katamtaman', 'neutral'],
  ['Katamtaman ang galing', 'neutral'],
  ['Katamtaman lang ang performance', 'neutral'],

  // Filipino: "hindi niya maayos" / "hindi siya nag-eeffort" (negative)
  ['Hindi niya maayos ang turo', 'negative'],
  ['Hindi maayos magturo', 'negative'],
  ['Hindi siya nag-eeffort', 'negative'],
  ['Walang effort', 'negative'],
  ['Walang effort magturo', 'negative'],

  // Taglish: "solid" (positive)
  ['Solid ang performance', 'positive'],
  ['Solid magturo', 'positive'],
  ['Solid yung class', 'positive'],
  ['Solid ang teaching', 'positive'],

  // Taglish: "strict" + "unfair" (negative)
  ['Strict at unfair', 'negative'],
  ['Sobrang strict tapos unfair pa', 'negative'],
  ['Ang strict unfair mag-grade', 'negative'],
  ['Strict pero unfair ang grading', 'negative'],

  // Taglish: "boring talaga" (negative)
  ['Boring talaga', 'negative'],
  ['Boring talaga ang class', 'negative'],
  ['Boring talaga ng klase niya', 'negative'],
  ['Sobrang boring talaga', 'negative'],
];

module.exports = trainingData;
