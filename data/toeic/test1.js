// TOEIC blanc n°1 : questions ORIGINALES écrites pour Lingua, au format du TOEIC Listening & Reading.
// Ce ne sont pas des questions officielles d'ETS (elles sont protégées et non publiques).
// Format réduit au quart : 25 questions d'écoute + 25 de lecture (le vrai test : 100 + 100).
//
// answer : index de la bonne réponse (0 = A). explain : explication en français, montrée à la correction.
// Rôles des voix : N = narrateur, M = homme, W = femme.

export default {
  id: 'blanc-1',
  title: 'TOEIC blanc n°1',
  readingMinutes: 19, // 75 min pour 100 questions dans le vrai test, soit 45 s par question
  parts: [
    {
      part: 1,
      items: [
        {
          id: 'p1-1',
          scene: ['👩‍💻', '☕', '🪴'],
          sceneAlt: 'Une femme travaille sur un ordinateur portable, une tasse de café et une plante sur le bureau.',
          statements: [
            'A woman is pouring a cup of coffee.',
            'A woman is typing on a laptop.',
            'A man is repairing a computer.',
            'The office is crowded with people.',
          ],
          answer: 1,
          explain: 'On voit une femme devant un ordinateur portable : « typing on a laptop » (elle tape sur un portable). Le café est sur le bureau, mais personne ne le verse (A).',
        },
        {
          id: 'p1-2',
          scene: ['🚲', '🚲', '🚲', '🌳'],
          sceneAlt: 'Trois vélos garés côte à côte près d’un arbre, personne autour.',
          statements: [
            'Some people are riding bicycles.',
            'A tree is being cut down.',
            'A bicycle is being repaired.',
            'Several bicycles have been parked in a row.',
          ],
          answer: 3,
          explain: 'Piège classique du TOEIC : « is being + participe » décrit une action en cours (B, C), or il n’y a personne sur l’image. « Have been parked » décrit un état : les vélos sont garés en rang.',
        },
        {
          id: 'p1-3',
          scene: ['📦', '📦', '📦', '🚚'],
          sceneAlt: 'Des cartons empilés à côté d’un camion de livraison, sans personne.',
          statements: [
            'Some boxes are stacked near a truck.',
            'A truck is being loaded by workers.',
            'The truck is parked inside a garage.',
            'A man is carrying a box.',
          ],
          answer: 0,
          explain: '« Stacked » = empilés. Aucun ouvrier ni aucun homme n’est visible, donc B et D sont fausses ; rien n’indique un garage (C).',
        },
      ],
    },
    {
      part: 2,
      items: [
        {
          id: 'p2-1',
          prompt: 'Where is the marketing meeting being held?',
          responses: ['At three o’clock.', 'In conference room B.', 'Yes, I met him yesterday.'],
          answer: 1,
          explain: '« Where » demande un lieu : « In conference room B ». (A) répond à « When », (C) à une question fermée et reprend le son « met / meeting ».',
        },
        {
          id: 'p2-2',
          prompt: 'When will the new printer be delivered?',
          responses: ['By the end of the week.', 'Print it in color, please.', 'To the second floor.'],
          answer: 0,
          explain: '« When » demande un moment : « by the end of the week » (d’ici la fin de la semaine). (B) reprend « print », (C) répondrait à « Where ».',
        },
        {
          id: 'p2-3',
          prompt: 'Who’s in charge of the budget report?',
          responses: ['It costs too much.', 'Yes, it was reported.', 'Ms. Chen, I believe.'],
          answer: 2,
          explain: '« Who » demande une personne : « Ms. Chen ». On ne répond jamais « Yes / No » à une question en Wh- (B).',
        },
        {
          id: 'p2-4',
          prompt: 'Why don’t we take a short break?',
          responses: ['Because it was broken.', 'That’s a good idea.', 'It lasted two hours.'],
          answer: 1,
          explain: '« Why don’t we…? » n’est pas une vraie question sur la cause : c’est une suggestion (« Et si on… ? »). On l’accepte : « That’s a good idea ». (A) tombe dans le piège du « Why → Because » et du son « break / broken ».',
        },
        {
          id: 'p2-5',
          prompt: 'Would you prefer the window seat or the aisle seat?',
          responses: ['The aisle, please.', 'Yes, I would.', 'It has a nice view.'],
          answer: 0,
          explain: 'Question à choix (« A or B ? ») : on choisit l’un des deux. « Yes, I would » ne répond pas au choix.',
        },
        {
          id: 'p2-6',
          prompt: 'Haven’t you sent the invoice to the client yet?',
          responses: ['He’s a new client.', 'I did it this morning.', 'The voice was very clear.'],
          answer: 1,
          explain: 'Question négative (« Tu n’as pas encore envoyé… ? ») : « Je l’ai fait ce matin ». (A) reprend « client », (C) joue sur le son « invoice / voice ».',
        },
        {
          id: 'p2-7',
          prompt: 'The conference has been moved to Thursday.',
          responses: ['It moved to London last year.', 'The conference room is on the left.', 'Thanks for letting me know.'],
          answer: 2,
          explain: 'Une information, pas une question : on remercie. (A) reprend « moved », (B) reprend « conference ».',
        },
      ],
    },
    {
      part: 3,
      sets: [
        {
          id: 'p3-1',
          lines: [
            { who: 'W', text: 'Hi Daniel, I’m putting together the order for office supplies. Do you need anything for your team?' },
            { who: 'M', text: 'Actually, yes. We’re running low on printer paper, and two of our staplers are broken.' },
            { who: 'W', text: 'OK, I’ll add those. But the order has to be submitted by noon today, so let me know if you think of anything else.' },
            { who: 'M', text: 'Will do. Oh, and could you check whether the supplier still offers free delivery? Last time we were charged a fee.' },
          ],
          questions: [
            { q: 'What is the woman preparing?', options: ['A budget report', 'A job advertisement', 'A supply order', 'A team schedule'], answer: 2, explain: '« I’m putting together the order for office supplies » : elle prépare une commande de fournitures.' },
            { q: 'What does the woman say about the deadline?', options: ['It is at noon today.', 'It has been extended.', 'It was yesterday.', 'It is next week.'], answer: 0, explain: '« The order has to be submitted by noon today » : la commande doit partir avant midi.' },
            { q: 'What does the man ask the woman to do?', options: ['Repair some staplers', 'Call a new supplier', 'Print some documents', 'Check a delivery policy'], answer: 3, explain: '« Could you check whether the supplier still offers free delivery? » : vérifier si la livraison est toujours gratuite.' },
          ],
        },
        {
          id: 'p3-2',
          lines: [
            { who: 'M', text: 'Good afternoon, Harbor View Hotel. How can I help you?' },
            { who: 'W', text: 'Hi, I booked a room for two nights starting Friday, but my flight has been delayed. I won’t arrive until after midnight.' },
            { who: 'M', text: 'That’s no problem. Our front desk is open twenty-four hours. May I have your reservation number?' },
            { who: 'W', text: 'Sure, it’s four, five, eight, two. Also, is breakfast included in the rate?' },
            { who: 'M', text: 'It is. Breakfast is served from six thirty to ten in the restaurant on the ground floor.' },
          ],
          questions: [
            { q: 'Why is the woman calling?', options: ['To cancel a reservation', 'To report a late arrival', 'To change her room type', 'To complain about a bill'], answer: 1, explain: 'Son vol est retardé : « I won’t arrive until after midnight ». Elle prévient de son arrivée tardive.' },
            { q: 'What does the man ask for?', options: ['A reservation number', 'A credit card number', 'A flight number', 'A phone number'], answer: 0, explain: '« May I have your reservation number? »' },
            { q: 'Where is breakfast served?', options: ['In the guest rooms', 'On the rooftop', 'In a nearby café', 'On the ground floor'], answer: 3, explain: '« In the restaurant on the ground floor » : au rez-de-chaussée.' },
          ],
        },
        {
          id: 'p3-3',
          graphic: {
            title: 'Departures',
            head: ['Destination', 'Time', 'Platform'],
            rows: [['Boston', '9:15', '2'], ['New York', '9:40', '5'], ['Philadelphia', '10:05', '3'], ['Washington', '10:30', '1']],
          },
          lines: [
            { who: 'W', text: 'Excuse me, I’m trying to get to Philadelphia. The board says the train leaves from platform three. Is that right?' },
            { who: 'M', text: 'It was, but there’s been a change. Because of maintenance work, that train now leaves from platform one.' },
            { who: 'W', text: 'Oh, thanks. Do I have time to buy a coffee?' },
            { who: 'M', text: 'Sure, it isn’t leaving for another twenty minutes. There’s a kiosk right next to the ticket machines.' },
          ],
          questions: [
            { q: 'Look at the graphic. What time does the woman’s train leave?', options: ['9:15', '9:40', '10:05', '10:30'], answer: 2, explain: 'Question « graphique » : elle va à Philadelphia, qui part à 10:05. Attention, le quai a changé (1 au lieu de 3), mais pas l’heure.' },
            { q: 'Why has the platform changed?', options: ['Because of bad weather', 'Because of maintenance work', 'Because of a delayed train', 'Because of a ticket problem'], answer: 1, explain: '« Because of maintenance work » : à cause de travaux d’entretien.' },
            { q: 'Where is the kiosk?', options: ['Next to the ticket machines', 'On platform three', 'Outside the station', 'Near the waiting room'], answer: 0, explain: '« Right next to the ticket machines » : juste à côté des distributeurs de billets.' },
          ],
        },
      ],
    },
    {
      part: 4,
      sets: [
        {
          id: 'p4-1',
          kind: 'Annonce',
          who: 'W',
          text: 'Good morning, everyone. Before we open the store, I have a quick announcement. Starting next Monday, we’ll be using a new system for processing returns. Instead of filling out paper forms, you’ll enter all the information on the tablets at the customer service desk. Jessica from the IT department will hold a thirty-minute training session this Thursday at eight a.m. Please make sure you attend, because the old forms won’t be accepted after Friday.',
          questions: [
            { q: 'Who most likely are the listeners?', options: ['Customers', 'IT technicians', 'Delivery drivers', 'Store employees'], answer: 3, explain: '« Before we open the store » et la formation obligatoire : ce sont des employés du magasin.' },
            { q: 'What will change next Monday?', options: ['The store’s opening hours', 'The way returns are processed', 'The location of the service desk', 'The price of a product'], answer: 1, explain: '« A new system for processing returns » : la façon de traiter les retours.' },
            { q: 'What are the listeners asked to do?', options: ['Fill out a survey', 'Buy new tablets', 'Attend a training session', 'Work on Friday'], answer: 2, explain: '« Please make sure you attend » la formation de jeudi.' },
          ],
        },
        {
          id: 'p4-2',
          kind: 'Message téléphonique',
          who: 'M',
          text: 'Hello, this is Ryan Patel from Greenfield Dental Clinic, calling for Ms. Alvarez. I’m calling to remind you of your appointment tomorrow at two fifteen p.m. Unfortunately, Dr. Moore had to change her schedule, so you’ll be seeing Dr. Kim instead. If you’d prefer to wait and see Dr. Moore next week, please call us back at five five five, zero one four two, before five o’clock today. Otherwise, we’ll see you tomorrow.',
          questions: [
            { q: 'What is the purpose of the call?', options: ['To confirm a payment', 'To advertise a new clinic', 'To remind someone of an appointment', 'To request medical records'], answer: 2, explain: '« I’m calling to remind you of your appointment » : rappel de rendez-vous.' },
            { q: 'What change does the speaker mention?', options: ['A different dentist', 'A different time', 'A different location', 'A different price'], answer: 0, explain: 'Elle verra le Dr Kim au lieu du Dr Moore : le dentiste change, pas l’heure.' },
            { q: 'What should Ms. Alvarez do if she wants to see Dr. Moore?', options: ['Send an e-mail', 'Visit the clinic', 'Arrive early tomorrow', 'Call back before 5 p.m.'], answer: 3, explain: '« Please call us back… before five o’clock today ».' },
          ],
        },
      ],
    },
    {
      part: 5,
      items: [
        { id: 'p5-1', sentence: 'The quarterly report must be submitted ------- Friday.', options: ['until', 'by', 'since', 'during'], answer: 1, explain: '« By + date » = au plus tard (une échéance). « Until » = jusqu’à (une durée qui continue).' },
        { id: 'p5-2', sentence: 'Ms. Lopez has worked for the company ------- 2015.', options: ['since', 'for', 'from', 'ago'], answer: 0, explain: 'Present perfect + point de départ : « since 2015 ». « For » s’emploie avec une durée (for ten years).' },
        { id: 'p5-3', sentence: 'All employees must wear their identification badges ------- in the building.', options: ['during', 'because', 'despite', 'while'], answer: 3, explain: '« While (they are) in the building » : « while » peut être suivi directement d’un lieu. « During » demande un nom (during the meeting).' },
        { id: 'p5-4', sentence: 'The new software is ------- easier to use than the previous version.', options: ['very', 'much', 'more', 'most'], answer: 1, explain: 'Pour renforcer un comparatif (easier), on utilise « much » (ou far, a lot), jamais « very ».' },
        { id: 'p5-5', sentence: 'Please contact Mr. Tanaka if you have any questions ------- the schedule.', options: ['regard', 'regarded', 'regarding', 'regards'], answer: 2, explain: '« Regarding » = concernant (préposition). Les autres formes sont des verbes ou des noms.' },
        { id: 'p5-6', sentence: 'The manager asked that the proposal ------- revised before the meeting.', options: ['be', 'is', 'was', 'being'], answer: 0, explain: 'Après « ask / request / suggest that », l’anglais soutenu utilise le subjonctif : la base verbale « be », sans -s ni temps.' },
        { id: 'p5-7', sentence: 'Due to high demand, tickets for the concert sold out ------- within an hour.', options: ['complete', 'completed', 'completion', 'completely'], answer: 3, explain: 'Il faut un adverbe pour modifier le verbe « sold out » : « completely » (complètement).' },
        { id: 'p5-8', sentence: '------- the weather was bad, the outdoor event went ahead as planned.', options: ['Despite', 'Although', 'However', 'Because'], answer: 1, explain: '« Although » + proposition (sujet + verbe). « Despite » est suivi d’un nom (despite the bad weather) ; « However » ne relie pas deux propositions ainsi.' },
      ],
    },
    {
      part: 6,
      sets: [
        {
          id: 'p6-1',
          title: 'E-mail',
          text: 'To: All staff\nFrom: Facilities Management\nSubject: Parking lot repairs\n\nPlease be aware that the north parking lot will be closed from Monday, June 3, to Wednesday, June 5, {1} repaving work. During this time, employees may park in the south lot or at the City Center garage, {2} is a five-minute walk from our building. Parking at the garage will be free for staff; simply show your employee ID at the entrance. {3} We apologize for any inconvenience and thank you for your {4}.',
          questions: [
            { options: ['because', 'due to', 'so that', 'in spite of'], answer: 1, explain: '« Due to » + nom (repaving work) = en raison de. « Because » demanderait une proposition (because of serait aussi possible).' },
            { options: ['who', 'where', 'which', 'what'], answer: 2, explain: 'Pronom relatif pour une chose (le garage), après une virgule : « which ». « Where » demanderait une proposition complète (where you can park).' },
            { options: ['Our new building will open next year.', 'The repaving company was founded in 1990.', 'Employee IDs can be renewed online.', 'Please note that spaces in the south lot are limited, so arrive early.'], answer: 3, explain: 'Phrase à insérer : il faut qu’elle suive le fil du texte (où se garer pendant les travaux). Seule D en parle.' },
            { options: ['patient', 'patience', 'patiently', 'patients'], answer: 1, explain: 'Après « your », il faut un nom : « patience ». « Patients » désigne les malades d’un médecin.' },
          ],
        },
      ],
    },
    {
      part: 7,
      sets: [
        {
          id: 'p7-1',
          passages: [{
            kind: 'Avis',
            body: 'NOTICE — Riverside Public Library\n\nThe library will be closed on Monday, October 14, for the installation of new computers. All borrowed items due on that day may be returned on Tuesday without a late fee. The online catalog and e-book service will remain available during the closure. For more information, visit our website or call 555-0199.',
          }],
          questions: [
            { q: 'Why will the library be closed?', options: ['For a public holiday', 'For staff training', 'For new equipment to be installed', 'For cleaning'], answer: 2, explain: '« For the installation of new computers » : pour installer de nouveaux ordinateurs (= new equipment). Le TOEIC reformule souvent avec des synonymes.' },
            { q: 'What is indicated about items due on October 14?', options: ['They can be returned the next day at no extra cost.', 'They must be renewed online.', 'They will be charged a late fee.', 'They should be returned by mail.'], answer: 0, explain: '« May be returned on Tuesday without a late fee » : le lendemain, sans pénalité.' },
          ],
        },
        {
          id: 'p7-2',
          passages: [{
            kind: 'Offre d’emploi',
            body: 'Sunrise Bakery is hiring!\n\nWe are looking for a part-time sales assistant to work weekend mornings (Saturday and Sunday, 6 a.m. to 12 p.m.). Responsibilities include serving customers, operating the cash register, and keeping the display cases clean. Previous retail experience is preferred but not required; full training will be provided. Applicants must be available to start by November 1. To apply, send your résumé by e-mail. Only candidates selected for an interview will be contacted.',
          }],
          questions: [
            { q: 'What position is being advertised?', options: ['Baker', 'Sales assistant', 'Delivery driver', 'Store manager'], answer: 1, explain: '« A part-time sales assistant » : vendeur ou vendeuse à temps partiel.' },
            { q: 'What is NOT mentioned as a responsibility?', options: ['Serving customers', 'Using the cash register', 'Baking bread', 'Cleaning display cases'], answer: 2, explain: 'Question « NOT » : on cherche ce qui n’est pas dans le texte. Faire le pain n’est pas cité.' },
            { q: 'What is suggested about applicants with no retail experience?', options: ['They can still apply.', 'They will not be considered.', 'They must pay for training.', 'They will work evenings.'], answer: 0, explain: '« Preferred but not required; full training will be provided » : l’expérience n’est pas obligatoire.' },
          ],
        },
        {
          id: 'p7-3',
          passages: [{
            kind: 'Messagerie',
            body: 'Karen Wu [9:02]: Hi Tom, are you still bringing the projector to the client meeting?\nTom Reyes [9:04]: Yes, but I just realized the cable is missing.\nKaren Wu [9:05]: No worries. I have a spare one in my desk drawer.\nTom Reyes [9:06]: You’re a lifesaver! I’ll pick it up on my way out.\nKaren Wu [9:07]: Sounds good. The meeting starts at 10:30, so let’s leave by 10.',
          }],
          questions: [
            { q: 'What problem does Mr. Reyes mention?', options: ['A projector is broken.', 'A meeting was canceled.', 'He will be late.', 'A cable is missing.'], answer: 3, explain: '« I just realized the cable is missing » : il manque le câble.' },
            { q: 'At 9:06, what does Mr. Reyes most likely mean when he writes, “You’re a lifesaver”?', options: ['He thinks Ms. Wu is a doctor.', 'He is grateful for Ms. Wu’s help.', 'He wants to go swimming.', 'He is worried about safety.'], answer: 1, explain: 'Expression idiomatique : « You’re a lifesaver! » = « Tu me sauves la vie ! », pour remercier.' },
            { q: 'When will they most likely leave for the meeting?', options: ['At 9:00', 'At 9:30', 'At 10:00', 'At 10:30'], answer: 2, explain: '« Let’s leave by 10 » : la réunion est à 10 h 30, mais ils partent à 10 h.' },
          ],
        },
        {
          id: 'p7-4',
          passages: [
            {
              kind: 'E-mail',
              body: 'To: Bright Office Supplies (orders)\nFrom: Laura Bennett, Kessler Design\nDate: March 12\nSubject: Order #7731\n\nHello,\nI received our order this morning, but there seems to be a problem. We ordered 10 boxes of A4 paper, but only 8 were delivered. Also, one of the two desk lamps arrived with a broken switch. Could you please send the missing paper and a replacement lamp as soon as possible? We need the lamps for our new employees, who start on Monday.\n\nThank you,\nLaura Bennett, Office Manager',
            },
            {
              kind: 'Facture',
              body: 'BRIGHT OFFICE SUPPLIES — INVOICE\nOrder #7731 · Customer: Kessler Design · Date: March 10\n\nA4 paper (box) — Qty 10 — $25 each — $250\nDesk lamp — Qty 2 — $40 each — $80\nInk cartridges — Qty 4 — $15 each — $60\n\nTOTAL: $390 · Payment due: April 10',
            },
          ],
          questions: [
            { q: 'Why did Ms. Bennett write the e-mail?', options: ['To place a new order', 'To ask for a discount', 'To report problems with an order', 'To change a delivery address'], answer: 2, explain: '« There seems to be a problem » : papier manquant et lampe cassée.' },
            { q: 'How many boxes of paper are missing?', options: ['One', 'Two', 'Eight', 'Ten'], answer: 1, explain: '10 commandées, 8 livrées : il en manque 2.' },
            { q: 'What is the unit price of the damaged item?', options: ['$15', '$25', '$40', '$60'], answer: 2, explain: 'Question sur deux documents : l’objet abîmé est une lampe (e-mail), qui coûte 40 $ l’unité (facture).' },
            { q: 'What is suggested about Kessler Design?', options: ['It is hiring new staff.', 'It is moving to a new office.', 'It sells office supplies.', 'It paid the invoice early.'], answer: 0, explain: '« Our new employees, who start on Monday » : l’entreprise embauche.' },
            { q: 'According to the invoice, when is payment due?', options: ['March 10', 'March 12', 'Next Monday', 'April 10'], answer: 3, explain: '« Payment due: April 10 ».' },
          ],
        },
      ],
    },
  ],
};
