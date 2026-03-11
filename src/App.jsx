import { useState, useEffect, useMemo, useCallback, useRef } from "react";

// ═══════════════════════════════════════════════════════════════════════
// CWIN ENTERPRISE CARE PLATFORM v3.1
// Editorial Design — Training, Case Mgmt, Wellness, Portals, Compliance
// "Care When It's Needed"
// ═══════════════════════════════════════════════════════════════════════

const CO={name:"CWIN At Home",legal:"CWIN At Home LLC",tag:"Care When It's Needed",addr:"15941 S. Harlem Ave. #305, Tinley Park IL 60477",phone:"708.476.0021",email:"CWINathome@gmail.com"};

// ═══════════════════════════════════════════════════════════════════════
// STATUS DEFINITIONS — Every status used across the platform
// ═══════════════════════════════════════════════════════════════════════
const STATUS_DEFS={
  // ── Client Statuses ──
  client:{
    active:{label:"Active",desc:"Currently receiving care services",color:"ok"},
    on_hold:{label:"On Hold",desc:"Services temporarily paused (hospitalization, vacation, family request)",color:"wn"},
    pending_assessment:{label:"Pending Assessment",desc:"Initial inquiry received, assessment not yet completed",color:"bl"},
    pending_start:{label:"Pending Start",desc:"Assessment done, agreement signed, awaiting first visit",color:"bl"},
    discharged:{label:"Discharged",desc:"Services ended (goals met, moved, deceased, transferred to facility)",color:"er"},
    inactive:{label:"Inactive",desc:"No active services for 30+ days, not formally discharged",color:"er"},
  },
  // ── Caregiver Statuses ──
  caregiver:{
    active:{label:"Active",desc:"Cleared to work, accepting assignments",color:"ok"},
    onboarding:{label:"Onboarding",desc:"Hired, completing orientation, background check, and training requirements",color:"bl"},
    on_leave:{label:"On Leave",desc:"Approved leave of absence (medical, personal, vacation)",color:"wn"},
    suspended:{label:"Suspended",desc:"Temporarily removed from assignments pending investigation",color:"er"},
    probation:{label:"Probation",desc:"90-day probationary period, performance under review",color:"wn"},
    terminated:{label:"Terminated",desc:"Employment ended (voluntary or involuntary)",color:"er"},
    inactive:{label:"Inactive",desc:"No shifts for 30+ days, not formally terminated",color:"er"},
  },
  // ── Schedule/Shift Statuses ──
  schedule:{
    draft:{label:"Draft",desc:"Created but not visible to caregivers. Can be edited freely.",color:"wn"},
    published:{label:"Published",desc:"Visible to assigned caregiver. Changes will trigger notification.",color:"ok"},
    confirmed:{label:"Confirmed",desc:"Caregiver has acknowledged and confirmed the shift.",color:"ok"},
    in_progress:{label:"In Progress",desc:"Caregiver has clocked in. Shift is active.",color:"bl"},
    completed:{label:"Completed",desc:"Caregiver clocked out. Pending reconciliation.",color:"ok"},
    missed:{label:"Missed",desc:"No clock-in recorded. Requires follow-up.",color:"er"},
    cancelled:{label:"Cancelled",desc:"Shift cancelled before start (by office, client, or caregiver).",color:"er"},
  },
  // ── Incident Statuses ──
  incident:{
    open:{label:"Open",desc:"Reported, awaiting review and action plan",color:"er"},
    under_review:{label:"Under Review",desc:"Being investigated, gathering information",color:"wn"},
    action_taken:{label:"Action Taken",desc:"Response implemented, monitoring outcomes",color:"bl"},
    resolved:{label:"Resolved",desc:"Issue addressed, follow-up complete, case closed",color:"ok"},
    escalated:{label:"Escalated",desc:"Referred to higher authority (MD, state agency, legal)",color:"er"},
  },
  // ── Expense Statuses ──
  expense:{
    pending:{label:"Pending",desc:"Submitted by caregiver, awaiting manager/owner review",color:"wn"},
    approved:{label:"Approved",desc:"Verified and approved for reimbursement",color:"ok"},
    rejected:{label:"Rejected",desc:"Denied (missing receipt, not billable, policy violation)",color:"er"},
    reimbursed:{label:"Reimbursed",desc:"Payment issued to caregiver",color:"ok"},
    billed:{label:"Billed to Client",desc:"Added to client invoice as reimbursable expense",color:"bl"},
  },
  // ── Recruiting Statuses ──
  cg_applicant:{
    new:{label:"New",desc:"Application received, not yet reviewed",color:"pu"},
    screening:{label:"Screening",desc:"Initial phone screen, credential verification in progress",color:"bl"},
    interview:{label:"Interview",desc:"Scheduled or completed in-person/video interview",color:"bl"},
    reference_check:{label:"Reference Check",desc:"Contacting references and previous employers",color:"wn"},
    bg_check:{label:"Background Check",desc:"Background check submitted, awaiting results",color:"wn"},
    offer:{label:"Offer Extended",desc:"Conditional or formal offer sent to candidate",color:"ok"},
    hired:{label:"Hired",desc:"Offer accepted, entering onboarding",color:"ok"},
    rejected:{label:"Rejected",desc:"Did not meet requirements or declined offer",color:"er"},
    withdrawn:{label:"Withdrawn",desc:"Candidate withdrew from consideration",color:"er"},
  },
  client_lead:{
    new:{label:"New Lead",desc:"Initial inquiry or referral received",color:"pu"},
    inquiry:{label:"Inquiry",desc:"Contacted, gathering information about care needs",color:"bl"},
    assessment:{label:"Assessment",desc:"In-home assessment scheduled or completed",color:"bl"},
    proposal:{label:"Proposal Sent",desc:"Service agreement and pricing sent to family",color:"wn"},
    active:{label:"Active Client",desc:"Agreement signed, services started",color:"ok"},
    lost:{label:"Lost",desc:"Did not convert (chose competitor, no longer needed, cost)",color:"er"},
  },
  // ── Compliance Statuses ──
  compliance:{
    current:{label:"Current",desc:"Up to date, no action needed",color:"ok"},
    expiring_soon:{label:"Expiring Soon",desc:"Due within 30 days, renewal needed",color:"wn"},
    overdue:{label:"Overdue",desc:"Past due date, immediate action required",color:"er"},
    not_applicable:{label:"N/A",desc:"Does not apply to this entity",color:"bl"},
  },
  // ── Care Goal Statuses ──
  care_goal:{
    on_track:{label:"On Track",desc:"Progress within expected range toward target",color:"ok"},
    achieved:{label:"Achieved",desc:"Goal met, maintain or set new target",color:"ok"},
    at_risk:{label:"At Risk",desc:"Progress stalled or regressing, care plan adjustment needed",color:"er"},
    modified:{label:"Modified",desc:"Goal adjusted based on changing client condition",color:"wn"},
    discontinued:{label:"Discontinued",desc:"Goal no longer relevant (condition change, client preference)",color:"er"},
  },
  // ── Service Request Statuses ──
  service_request:{
    pending:{label:"Pending",desc:"Submitted, awaiting office review",color:"wn"},
    acknowledged:{label:"Acknowledged",desc:"Received and noted, working on response",color:"bl"},
    approved:{label:"Approved",desc:"Request approved and scheduled/implemented",color:"ok"},
    completed:{label:"Completed",desc:"Request fulfilled",color:"ok"},
    denied:{label:"Denied",desc:"Cannot accommodate (with explanation)",color:"er"},
    resolved:{label:"Resolved",desc:"Issue addressed to client's satisfaction",color:"ok"},
  },
};

// ═══════════════════════════════════════════════════════════════════════
// ADL OPTIONS — Per-category, clinically comprehensive (Katz/Barthel aligned)
// ═══════════════════════════════════════════════════════════════════════
const ADL_OPTIONS={
  bathing:[
    "Independent — bathes self completely without assistance",
    "Independent with setup — needs help gathering supplies or adjusting water temperature only",
    "Supervision — caregiver present for safety, verbal cues only",
    "Standby assist — caregiver within arm's reach, hands-off unless needed",
    "Minimal assist (25%) — can do most of task, needs help with one body part (e.g. back, feet)",
    "Moderate assist (50%) — needs hands-on help with washing upper or lower body",
    "Maximum assist (75%) — does some part of task, caregiver does majority",
    "Total dependence — caregiver performs entire bathing task",
    "Sponge bath only — unable to use tub/shower, bed bath required",
    "Refuses bathing — client declines, requires motivational approach",
  ],
  dressing:[
    "Independent — selects clothes and dresses without assistance",
    "Independent with setup — needs clothes laid out or adaptive closet",
    "Supervision — verbal cues for sequencing or weather-appropriate choices",
    "Standby assist — can dress self but needs someone nearby for balance",
    "Minimal assist (25%) — needs help with buttons, zippers, or back closures",
    "Moderate assist (50%) — can do upper or lower body but not both",
    "Maximum assist (75%) — participates but caregiver does majority",
    "Total dependence — caregiver performs all dressing tasks",
    "Minimal assist due to tremor — fine motor difficulty with fasteners",
    "Adaptive equipment — uses button hook, elastic laces, velcro closures",
  ],
  eating:[
    "Independent — feeds self without assistance",
    "Independent with setup — needs meal cut, containers opened, tray positioned",
    "Independent with adaptive equipment — uses built-up utensils, plate guard, etc.",
    "Supervision — monitoring for choking, pacing, or intake adequacy",
    "Minimal assist (25%) — occasional steadying of hand or utensil guidance",
    "Moderate assist (50%) — feeds self with frequent help, may tire mid-meal",
    "Maximum assist (75%) — needs hand-over-hand or mostly fed by caregiver",
    "Total dependence — must be fed entirely by caregiver",
    "Modified texture diet — requires pureed, minced, or soft foods",
    "Tube feeding — receives nutrition via PEG/NG tube",
    "NPO — nothing by mouth (medical restriction)",
  ],
  toileting:[
    "Independent — uses toilet without assistance, manages clothing",
    "Independent with equipment — uses raised seat, grab bars, or commode",
    "Supervision — reminders to go, verbal cues for hygiene",
    "Standby assist — needs someone nearby for transfers or balance",
    "Minimal assist (25%) — needs help with clothing or hygiene after",
    "Moderate assist (50%) — needs help transferring on/off toilet and with hygiene",
    "Maximum assist (75%) — caregiver provides most help, client participates partially",
    "Total dependence — caregiver manages all toileting needs",
    "Incontinence management — uses briefs/pads, scheduled toileting program",
    "Catheter care — has indwelling or intermittent catheter",
    "Colostomy/Ostomy care — requires bag emptying and skin care",
    "Bedpan/Urinal only — bedbound, unable to use toilet or commode",
  ],
  mobility:[
    "Independent — walks without assistance or devices",
    "Independent with device — uses cane independently",
    "Independent with device — uses walker independently",
    "Independent with device — uses rollator independently",
    "Supervision — safe to walk, needs someone nearby or verbal cues",
    "Contact guard assist — caregiver places hand on client for balance, no lifting",
    "Minimal assist (25%) — steady gait but occasional loss of balance",
    "Moderate assist (50%) — needs consistent hands-on support for ambulation",
    "Maximum assist (75%) — bears some weight but needs significant support",
    "Two-person assist — requires two caregivers for safe ambulation",
    "Wheelchair dependent — uses manual wheelchair, may self-propel",
    "Wheelchair dependent — uses power wheelchair",
    "Bedbound — unable to leave bed, requires repositioning q2h",
    "Transfer assist only — walks once up but needs help sit-to-stand",
    "Fall risk — ambulatory but history of falls, requires precautions",
    "Slow gait, balance issues — ambulatory with gait abnormality",
  ],
  transferring:[
    "Independent — moves in/out of bed, chair, toilet without help",
    "Independent with equipment — uses transfer board, pole, or lift independently",
    "Supervision — needs someone present during transfers for safety",
    "Standby assist — caregiver within arm's reach, no contact unless needed",
    "Minimal assist (25%) — needs steadying or light support during pivot",
    "Moderate assist (50%) — needs consistent hands-on help to stand/pivot",
    "Maximum assist (75%) — bears some weight, caregiver provides most effort",
    "Mechanical lift — Hoyer or sit-to-stand lift required",
    "Two-person assist — requires two caregivers for all transfers",
    "Total dependence — unable to participate in transfers",
    "Slide board transfer — uses transfer board between surfaces",
  ],
  continence:[
    "Continent — full bowel and bladder control",
    "Occasionally incontinent — accidents less than weekly",
    "Frequently incontinent — accidents multiple times per week",
    "Bowel continent, bladder incontinent",
    "Bladder continent, bowel incontinent",
    "Incontinent — no bowel or bladder control",
    "Managed with scheduled toileting — continent when prompted",
    "Managed with pads/briefs — wears protection",
    "Catheterized — bladder managed with catheter",
    "Colostomy/Ileostomy — bowel managed with ostomy",
  ],
  cognition:[
    "Intact — alert, oriented x4 (person, place, time, situation)",
    "Mild impairment — occasional forgetfulness, all ADLs independent",
    "Mild cognitive impairment (MCI) — diagnosed, memory lapses, judgment intact",
    "Moderate impairment — needs reminders for daily tasks, supervision recommended",
    "Moderate dementia — disoriented to time/place, needs structured routine",
    "Severe impairment — limited recognition of family, requires constant supervision",
    "Severe dementia — non-verbal or minimal verbal, total care needed",
    "Fluctuating — good days and bad days, Lewy body pattern",
    "Oriented but poor safety judgment — wanders, leaves stove on",
    "Sundowning — cognitive decline in afternoon/evening",
    "Delirium — acute confusion, medical evaluation needed",
  ],
};

// ═══════════════════════════════════════════════════════════════════════
// SEVERITY & ACUITY DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════
const SEVERITY_DEFS={
  low:{label:"Low",desc:"No immediate risk. Document and monitor. Routine follow-up.",color:"wn"},
  medium:{label:"Medium",desc:"Potential risk to client safety or health. Requires timely response within 24 hours. Notify supervisor.",color:"er"},
  high:{label:"High",desc:"Significant risk. Immediate action required. Notify supervisor and family. MD consultation may be needed.",color:"er"},
  critical:{label:"Critical",desc:"Life-threatening or serious harm. Call 911 first. Notify all parties immediately. Full incident documentation required.",color:"er"},
};

const ACUITY_LEVELS={
  1:{label:"Level 1 — Minimal",desc:"Independent in most ADLs, companionship/light housekeeping focus. 1-3 visits/week.",hours:"4-12 hrs/week"},
  2:{label:"Level 2 — Low",desc:"Needs standby/minimal assist with 1-2 ADLs. Medication reminders. 3-5 visits/week.",hours:"12-20 hrs/week"},
  3:{label:"Level 3 — Moderate",desc:"Needs hands-on assist with multiple ADLs. Fall risk. Complex medications. Daily visits.",hours:"20-35 hrs/week"},
  4:{label:"Level 4 — High",desc:"Dependent in most ADLs. Cognitive impairment. High fall risk. Multiple chronic conditions. Daily extended visits.",hours:"35-56 hrs/week"},
  5:{label:"Level 5 — Total Care",desc:"Total dependence all ADLs. Bedbound or near-bedbound. May need 2-person assist. 24/7 or live-in care.",hours:"56+ hrs/week"},
};

// ═══════════════════════════════════════════════════════════════════════
// REFERENCE LISTS — Searchable typeahead data
// ═══════════════════════════════════════════════════════════════════════
const DX_LIST=[
  // Cardiac
  "Hypertension (HTN)","Congestive Heart Failure (CHF)","Atrial Fibrillation (AFib)","Coronary Artery Disease (CAD)","Heart Valve Disease","Cardiomyopathy","Peripheral Artery Disease (PAD)","Deep Vein Thrombosis (DVT)","Angina","Aortic Stenosis","Bradycardia","Tachycardia","Heart Murmur","Post-MI (Myocardial Infarction)","Pacemaker",
  // Neurological
  "Alzheimer's Disease","Parkinson's Disease","Dementia (unspecified)","Vascular Dementia","Lewy Body Dementia","Frontotemporal Dementia","Stroke (CVA)","TIA (Mini-Stroke)","Multiple Sclerosis (MS)","Epilepsy/Seizure Disorder","Neuropathy (Peripheral)","Diabetic Neuropathy","Essential Tremor","Traumatic Brain Injury (TBI)","Bell's Palsy","Myasthenia Gravis","ALS (Lou Gehrig's Disease)","Huntington's Disease","Normal Pressure Hydrocephalus","Post-Concussion Syndrome",
  // Respiratory
  "COPD","Emphysema","Chronic Bronchitis","Asthma","Pulmonary Fibrosis","Pneumonia (recurrent)","Sleep Apnea","Oxygen Dependent","Tracheostomy","Pleural Effusion",
  // Endocrine
  "Diabetes Mellitus Type 1","Diabetes Mellitus Type 2","Hypothyroidism","Hyperthyroidism","Adrenal Insufficiency","Osteoporosis","Cushing's Syndrome","PCOS",
  // Musculoskeletal
  "Osteoarthritis","Rheumatoid Arthritis","Gout","Osteoporosis","Hip Fracture (history)","Hip Replacement","Knee Replacement","Shoulder Replacement","Spinal Stenosis","Degenerative Disc Disease","Scoliosis","Fibromyalgia","Lupus (SLE)","Amputation (upper)","Amputation (lower/BKA)","Amputation (lower/AKA)",
  // GI
  "GERD","Crohn's Disease","Ulcerative Colitis","Diverticulitis","Celiac Disease","IBS","Liver Cirrhosis","Hepatitis B","Hepatitis C","Pancreatitis","G-tube/PEG","Dysphagia","Bowel Obstruction (history)","Colostomy","Ileostomy",
  // Renal/Urinary
  "Chronic Kidney Disease (CKD)","End-Stage Renal Disease (ESRD)","Dialysis","UTI (recurrent)","Urinary Incontinence","Urinary Retention","Kidney Stones (recurrent)","Nephrostomy","Suprapubic Catheter",
  // Psychiatric/Behavioral
  "Major Depressive Disorder","Bipolar Disorder","Generalized Anxiety Disorder","PTSD","Schizophrenia","Schizoaffective Disorder","Hoarding Disorder","Substance Use Disorder","Alcohol Use Disorder","Insomnia","Sundowning","Agitation/Behavioral Issues",
  // Cancer/Oncology
  "Breast Cancer","Lung Cancer","Prostate Cancer","Colon Cancer","Pancreatic Cancer","Leukemia","Lymphoma","Cancer (in remission)","Cancer (palliative/terminal)",
  // Visual/Hearing
  "Macular Degeneration","Glaucoma","Cataracts","Legally Blind","Hearing Loss (bilateral)","Hearing Loss (unilateral)","Cochlear Implant",
  // Other
  "Anemia","Obesity","Malnutrition/Failure to Thrive","Pressure Ulcer/Wound","Chronic Pain Syndrome","Fall Risk","Frequent Falls","DVT/PE Risk","History of Falls","Contractures","Edema (lower extremity)","Lymphedema","Decubitus Ulcer","Sepsis (history)","COVID-19 Long Haul","Hospice/Palliative","Do Not Resuscitate (DNR)","POLST on File",
];

const MED_LIST=[
  // Cardiac/BP
  "Lisinopril 5mg","Lisinopril 10mg","Lisinopril 20mg","Amlodipine 5mg","Amlodipine 10mg","Metoprolol Tartrate 25mg","Metoprolol Tartrate 50mg","Metoprolol Succinate 25mg ER","Metoprolol Succinate 50mg ER","Losartan 25mg","Losartan 50mg","Losartan 100mg","Atenolol 25mg","Atenolol 50mg","Furosemide (Lasix) 20mg","Furosemide (Lasix) 40mg","Hydrochlorothiazide 12.5mg","Hydrochlorothiazide 25mg","Spironolactone 25mg","Digoxin 0.125mg","Digoxin 0.25mg","Carvedilol 6.25mg","Carvedilol 12.5mg","Hydralazine 25mg","Isosorbide Mononitrate 30mg ER","Nitroglycerin 0.4mg SL PRN",
  // Blood Thinners
  "Warfarin (Coumadin) 1mg","Warfarin (Coumadin) 2mg","Warfarin (Coumadin) 5mg","Eliquis (Apixaban) 2.5mg","Eliquis (Apixaban) 5mg","Xarelto (Rivaroxaban) 10mg","Xarelto (Rivaroxaban) 20mg","Aspirin 81mg","Aspirin 325mg","Plavix (Clopidogrel) 75mg",
  // Diabetes
  "Metformin 500mg","Metformin 1000mg","Metformin 500mg ER","Glipizide 5mg","Glipizide 10mg","Insulin Glargine (Lantus)","Insulin Lispro (Humalog)","Insulin Aspart (NovoLog)","Insulin NPH","Jardiance (Empagliflozin) 10mg","Jardiance 25mg","Ozempic (Semaglutide) 0.5mg","Ozempic 1mg","Trulicity (Dulaglutide) 0.75mg","Farxiga (Dapagliflozin) 10mg",
  // Cholesterol
  "Atorvastatin 10mg","Atorvastatin 20mg","Atorvastatin 40mg","Atorvastatin 80mg","Rosuvastatin 5mg","Rosuvastatin 10mg","Rosuvastatin 20mg","Simvastatin 20mg","Simvastatin 40mg","Pravastatin 40mg","Ezetimibe 10mg","Fenofibrate 145mg",
  // Pain
  "Acetaminophen (Tylenol) 500mg","Ibuprofen 200mg","Ibuprofen 400mg","Ibuprofen 600mg","Naproxen 250mg","Naproxen 500mg","Gabapentin 100mg","Gabapentin 300mg","Gabapentin 600mg","Pregabalin (Lyrica) 75mg","Tramadol 50mg","Hydrocodone/APAP 5/325mg","Oxycodone 5mg","Morphine Sulfate 15mg ER","Lidocaine Patch 5%","Duloxetine (Cymbalta) 30mg","Duloxetine 60mg","Meloxicam 7.5mg","Meloxicam 15mg","Diclofenac Gel 1%",
  // Neurological/Parkinson's
  "Carbidopa-Levodopa 25/100mg","Carbidopa-Levodopa 25/250mg","Carbidopa-Levodopa CR 25/100mg","Pramipexole 0.25mg","Pramipexole 0.5mg","Ropinirole 0.5mg","Ropinirole 1mg","Entacapone 200mg","Amantadine 100mg","Donepezil (Aricept) 5mg","Donepezil 10mg","Memantine (Namenda) 10mg","Rivastigmine Patch 4.6mg","Rivastigmine Patch 9.5mg","Levetiracetam (Keppra) 500mg","Phenytoin (Dilantin) 100mg","Carbamazepine 200mg","Valproic Acid 250mg",
  // Psychiatric
  "Sertraline (Zoloft) 50mg","Sertraline 100mg","Escitalopram (Lexapro) 10mg","Escitalopram 20mg","Fluoxetine (Prozac) 20mg","Citalopram (Celexa) 20mg","Paroxetine (Paxil) 20mg","Trazodone 50mg","Trazodone 100mg","Mirtazapine 15mg","Mirtazapine 30mg","Buspirone 10mg","Lorazepam (Ativan) 0.5mg","Lorazepam 1mg","Alprazolam (Xanax) 0.25mg","Clonazepam (Klonopin) 0.5mg","Quetiapine (Seroquel) 25mg","Quetiapine 50mg","Olanzapine (Zyprexa) 5mg","Risperidone 0.5mg","Risperidone 1mg","Haloperidol 0.5mg","Lithium 300mg",
  // GI
  "Omeprazole (Prilosec) 20mg","Omeprazole 40mg","Pantoprazole (Protonix) 40mg","Famotidine (Pepcid) 20mg","Docusate Sodium (Colace) 100mg","Senna 8.6mg","Polyethylene Glycol (MiraLAX)","Ondansetron (Zofran) 4mg","Metoclopramide 10mg","Lactulose 15mL","Sucralfate 1g",
  // Respiratory
  "Albuterol Inhaler (ProAir) PRN","Fluticasone Inhaler (Flovent)","Tiotropium (Spiriva)","Budesonide/Formoterol (Symbicort)","Fluticasone/Salmeterol (Advair)","Montelukast (Singulair) 10mg","Prednisone 5mg","Prednisone 10mg","Prednisone 20mg","Dexamethasone 4mg",
  // Thyroid
  "Levothyroxine 25mcg","Levothyroxine 50mcg","Levothyroxine 75mcg","Levothyroxine 88mcg","Levothyroxine 100mcg","Levothyroxine 112mcg","Levothyroxine 125mcg","Methimazole 5mg",
  // Supplements/Other
  "Calcium + Vitamin D 600/400","Vitamin D3 1000 IU","Vitamin D3 2000 IU","Vitamin D3 5000 IU","Vitamin B12 1000mcg","Iron (Ferrous Sulfate) 325mg","Folic Acid 1mg","Magnesium Oxide 400mg","Potassium Chloride 20mEq","Fish Oil 1000mg","Multivitamin Daily","CoQ10 100mg","Melatonin 3mg","Melatonin 5mg","Cranberry Extract 500mg",
  // Topical/Eye
  "Timolol Eye Drops 0.5%","Latanoprost Eye Drops","Artificial Tears PRN","Erythromycin Eye Ointment","Silver Sulfadiazine Cream","Mupirocin Ointment 2%","Triamcinolone Cream 0.1%","Ketoconazole Cream 2%","Nystatin Powder",
  // Urinary
  "Tamsulosin (Flomax) 0.4mg","Finasteride 5mg","Oxybutynin 5mg","Tolterodine (Detrol) 2mg",
];

const INTERESTS_LIST=[
  // Arts & Crafts
  "Painting","Watercolors","Drawing/Sketching","Knitting","Crocheting","Quilting","Sewing","Needlepoint","Cross-stitch","Pottery","Ceramics","Scrapbooking","Card making","Flower arranging","Woodworking","Model building","Calligraphy","Photography","Coloring books","Origami","Jewelry making","Weaving","Embroidery",
  // Music
  "Classical music","Jazz music","Gospel music","Country music","Oldies/Motown","Opera","Blues","Big band/Swing","Playing piano","Playing guitar","Playing harmonica","Singing","Church choir","Listening to vinyl records","Music therapy",
  // Games & Puzzles
  "Crossword puzzles","Jigsaw puzzles","Sudoku","Word search","Bridge club","Poker","Pinochle","Canasta","Rummy","Chess","Checkers","Dominoes","Bingo","Trivia games","Board games","Mahjong","Solitaire",
  // Reading & Writing
  "Reading mystery novels","Reading romance novels","Reading historical fiction","Reading biographies","Reading newspapers","Reading large-print books","Audiobooks","Poetry","Writing letters","Journaling","Memoir writing","Book club","Reading scripture/religious texts","Reading magazines",
  // Nature & Outdoors
  "Gardening","Bird watching","Nature walks","Fishing","Flower gardening","Vegetable gardening","Visiting parks","Feeding birds","Sitting on porch/patio","Watching sunsets","Picnics","Visiting botanical gardens","Indoor plants/terrariums",
  // Social & Community
  "Church/synagogue/mosque attendance","Bible study","Prayer groups","Volunteering","Senior center activities","Visiting with friends","Phone calls with family","Video calls with grandchildren","Community events","Potlucks","Holiday celebrations","Tea/coffee with friends","Mentoring/tutoring",
  // Exercise & Movement
  "Chair exercises","Walking","Swimming","Water aerobics","Tai chi","Gentle yoga","Stretching","Balance exercises","Dancing","Line dancing","Ballroom dancing","Wii bowling/sports","Physical therapy exercises","Resistance bands","Seated cycling",
  // Food & Cooking
  "Cooking","Baking","Cake decorating","Trying new recipes","Watching cooking shows","Meal planning","Canning/preserving","Making soup","Baking bread","Making cookies for neighbors","Sharing family recipes","Wine appreciation","Tea ceremony",
  // Entertainment
  "Watching old movies","Watching Cubs games","Watching Bears games","Watching White Sox games","Watching Bulls games","Watching Blackhawks games","Watching game shows","Watching documentaries","Watching nature programs","Watching news","Watching Jeopardy","Watching Wheel of Fortune","Watching cooking shows","Watching soap operas","Listening to radio","Listening to podcasts",
  // History & Culture
  "Visiting museums","Art galleries","Historical lectures","Genealogy research","Collecting stamps","Collecting coins","Collecting figurines","Antiques","Learning languages","Cultural festivals","Travel stories/memories",
  // Pets & Animals
  "Dog companionship","Cat companionship","Visiting pet therapy animals","Watching wildlife","Aquarium/fish","Visiting farm animals",
  // Technology
  "FaceTime with family","Social media (Facebook)","Email correspondence","Looking at family photos online","Using tablet/iPad","Online shopping","Watching YouTube","Video chatting with grandchildren",
];

// ═══════════════════════════════════════════════════════════════════════
// TYPEAHEAD INPUT COMPONENT
// ═══════════════════════════════════════════════════════════════════════
function TypeaheadInput({list,placeholder,onSelect,existing=[]}){
  const [q,setQ]=useState("");
  const [focused,setFocused]=useState(false);
  const filtered=q.length>=2?list.filter(i=>i.toLowerCase().includes(q.toLowerCase())&&!existing.includes(i)).slice(0,8):[];
  return <div style={{position:"relative"}}>
    <div style={{display:"flex",gap:6}}>
      <input value={q} onChange={e=>setQ(e.target.value)} onFocus={()=>setFocused(true)} onBlur={()=>setTimeout(()=>setFocused(false),200)} placeholder={placeholder} style={{flex:1,padding:"8px 10px",border:"var(--border-thin)",fontSize:12,fontFamily:"var(--f)"}}/>
      <button className="btn btn-sm btn-p" onClick={()=>{if(q.trim()){onSelect(q.trim());setQ("");}}} disabled={!q.trim()}>+</button>
    </div>
    {focused&&filtered.length>0&& <div style={{position:"absolute",top:"100%",left:0,right:0,zIndex:20,background:"var(--card)",border:"var(--border-thin)",maxHeight:240,overflowY:"auto",boxShadow:"0 8px 24px rgba(0,0,0,.12)"}}>
      {filtered.map((item,i)=> <div key={i} onMouseDown={()=>{onSelect(item);setQ("");}} style={{padding:"8px 12px",fontSize:12,cursor:"pointer",borderBottom:"var(--border-thin)"}} onMouseEnter={e=>e.target.style.background="rgba(0,0,0,.03)"} onMouseLeave={e=>e.target.style.background=""}>{item}</div>)}
    </div>}
  </div>;
}

// ═══════════════════════════════════════════════════════════════════════
// AI CLINICAL AGENT — Acuity scoring, action recommendations
// ═══════════════════════════════════════════════════════════════════════
function ClinicalAgent({cl,incidents,careNotes}){
  const dxCount=cl.dx.length;
  const medCount=cl.meds.length;
  const highRiskDx=cl.dx.filter(d=>/(CHF|Heart Failure|COPD|Dialysis|Cancer|Hospice|ALS|Fall|Stroke|Dementia|Alzheimer|Parkinson)/i.test(d));
  const adlDep=Object.values(cl.adl).filter(v=>/(Moderate|Maximum|Total|Dependent|Bedbound|Severe)/i.test(v)).length;
  const adlTotal=Object.keys(cl.adl).length;
  const recentInc=incidents.filter(i=>i.clientId===cl.id).slice(0,5);
  const openInc=recentInc.filter(i=>i.status==="open").length;
  const cogImpaired=cl.adl.cognition&&/(Moderate|Severe|dementia|Fluctuating|Sundowning)/i.test(cl.adl.cognition);

  // Acuity calculation
  let acuity=1;
  if(dxCount>=3)acuity++;if(highRiskDx.length>=2)acuity++;if(adlDep>=3)acuity++;if(adlDep>=5)acuity++;
  if(medCount>=8)acuity++;if(cogImpaired)acuity++;if(openInc>0)acuity++;
  acuity=Math.min(acuity,5);
  const lvl=ACUITY_LEVELS[acuity];

  // Medication interactions/flags
  const hasBT=cl.meds.some(m=>/(Warfarin|Eliquis|Xarelto|Plavix|Aspirin)/i.test(m));
  const hasInsulin=cl.meds.some(m=>/Insulin/i.test(m));
  const hasPark=cl.meds.some(m=>/Carbidopa|Levodopa|Pramipexole/i.test(m));
  const hasPsych=cl.meds.some(m=>/(Lorazepam|Alprazolam|Clonazepam|Quetiapine|Haloperidol)/i.test(m));

  return <div className="ai-card" style={{background:"linear-gradient(135deg,#0a0a0a,#1a0a0a)"}}>
    <h4><span className="pulse" style={{background:acuity>=4?"#7a3030":acuity>=3?"#8a7356":"#3c4f3d"}}/>Clinical Agent — {cl.name}</h4>
    <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,margin:"12px 0"}}>
      <div style={{padding:10,background:"rgba(255,255,255,.06)",textAlign:"center"}}><div style={{fontSize:9,textTransform:"uppercase",letterSpacing:1,opacity:.4}}>Acuity</div><div style={{fontFamily:"var(--fd)",fontSize:24,fontWeight:400,color:acuity>=4?"#ff6b6b":acuity>=3?"#ffa94d":"#69db7c"}}>{acuity}</div></div>
      <div style={{padding:10,background:"rgba(255,255,255,.06)",textAlign:"center"}}><div style={{fontSize:9,textTransform:"uppercase",letterSpacing:1,opacity:.4}}>Diagnoses</div><div style={{fontSize:18,fontWeight:600}}>{dxCount}</div></div>
      <div style={{padding:10,background:"rgba(255,255,255,.06)",textAlign:"center"}}><div style={{fontSize:9,textTransform:"uppercase",letterSpacing:1,opacity:.4}}>Medications</div><div style={{fontSize:18,fontWeight:600}}>{medCount}</div></div>
      <div style={{padding:10,background:"rgba(255,255,255,.06)",textAlign:"center"}}><div style={{fontSize:9,textTransform:"uppercase",letterSpacing:1,opacity:.4}}>ADL Assist</div><div style={{fontSize:18,fontWeight:600}}>{adlDep}/{adlTotal}</div></div>
    </div>
    <p style={{fontSize:11,opacity:.6,lineHeight:1.7}}>
      <strong style={{opacity:1}}>Acuity {acuity}: {lvl?.label?.split(" — ")[1]}</strong> — {lvl?.desc} Recommended: {lvl?.hours}.
      {highRiskDx.length>0&&` High-risk conditions: ${highRiskDx.join(", ")}. Ensure care plan addresses these specifically.`}
      {hasBT&&" ⚠️ BLOOD THINNER: Monitor for bruising, bleeding, falls. Ensure INR monitoring if on Warfarin."}
      {hasInsulin&&" ⚠️ INSULIN: Blood glucose monitoring required. Hypoglycemia education for caregiver. Keep fast-acting sugar available."}
      {hasPark&&" ⚠️ PARKINSON'S MEDS: Timing is critical. Carbidopa-Levodopa must be taken on schedule. Do not skip or delay doses."}
      {hasPsych&&" ⚠️ PSYCHOTROPIC: Fall risk increased. Monitor for sedation, confusion, orthostatic hypotension."}
      {cogImpaired&&" 🧠 COGNITIVE: Structured routine essential. Redirect, don't argue. Evaluate for wandering risk."}
      {openInc>0&&` 🚨 ${openInc} OPEN INCIDENT${openInc>1?"S":""}: Requires resolution before next visit.`}
      {adlDep>=5&&" Consider increasing visit frequency or transitioning to live-in care model."}
    </p>
  </div>;
}

// ═══════════════════════════════════════════════════════════════════════
// AI SOCIAL AGENT — Activity matching, isolation prevention
// ═══════════════════════════════════════════════════════════════════════
function SocialAgent({cl}){
  const interests=cl.social?.interests||[];
  const mobility=cl.adl?.mobility||"";
  const cognition=cl.adl?.cognition||"";
  const canLeaveHome=!/(Bedbound|Wheelchair dependent|Two-person|Total dependence)/i.test(mobility);
  const canDriveOrRide=!/(Maximum|Total|Bedbound)/i.test(mobility);
  const cogOk=!/(Severe|dementia.*non-verbal)/i.test(cognition);
  const faith=cl.social?.faith||"";

  const suggestions=[];

  // Interest-based suggestions with real Chicago venues
  if(interests.some(i=>/Bridge/i.test(i))) suggestions.push({act:"Bridge Club",where:"Lincoln Park Community Center, 2045 N Lincoln",when:"Tuesdays & Thursdays 1pm",type:"social"});
  if(interests.some(i=>/Classical music/i.test(i))) suggestions.push({act:"CSO Free Concerts",where:"Millennium Park, Jay Pritzker Pavilion",when:"Summer Wednesdays & Fridays 6:30pm",type:"music"});
  if(interests.some(i=>/Jazz/i.test(i))) suggestions.push({act:"Jazz Matinee",where:"Jazz Showcase, 806 S Plymouth Ct",when:"Sundays 4pm matinee",type:"music"});
  if(interests.some(i=>/Cubs/i.test(i))) suggestions.push({act:"Cubs Games (Accessible Seating)",where:"Wrigley Field, 1060 W Addison",when:"Home games April-September",type:"sports"});
  if(interests.some(i=>/old movies|Movies/i.test(i))) suggestions.push({act:"Classic Film Screenings",where:"Music Box Theatre, 3733 N Southport",when:"Various matinees",type:"entertainment"});
  if(interests.some(i=>/Crossword|puzzle/i.test(i))) suggestions.push({act:"Puzzle & Games Club",where:"Chicago Public Library (local branch)",when:"Wednesdays 2pm",type:"social"});
  if(interests.some(i=>/Garden/i.test(i))) suggestions.push({act:"Conservatory Visit",where:"Lincoln Park Conservatory (free)",when:"Open daily 10am-5pm",type:"nature"});
  if(interests.some(i=>/Bird/i.test(i))) suggestions.push({act:"Bird Watching Group",where:"Montrose Point Bird Sanctuary",when:"Spring/Fall migration weekends",type:"nature"});
  if(interests.some(i=>/Book club|Reading/i.test(i))) suggestions.push({act:"Book Discussion Group",where:"Chicago Public Library (local branch)",when:"Monthly, various days",type:"social"});
  if(interests.some(i=>/Bingo/i.test(i))) suggestions.push({act:"Community Bingo Night",where:"Local senior center or church hall",when:"Fridays 6:30pm",type:"social"});
  if(interests.some(i=>/Chair exercise|Yoga|Tai chi|Exercise/i.test(i))) suggestions.push({act:"Senior Fitness Class",where:"Local Park District fieldhouse",when:"Mon/Wed/Fri 10am",type:"exercise"});
  if(interests.some(i=>/Paint|Art|Draw/i.test(i))) suggestions.push({act:"Art Workshop for Seniors",where:"Art Institute of Chicago (free for IL seniors)",when:"Thursdays 1-3pm",type:"arts"});
  if(interests.some(i=>/Museum/i.test(i))) suggestions.push({act:"Museum Free Days",where:"Various Chicago museums",when:"Check schedule (many have free senior days)",type:"culture"});
  if(interests.some(i=>/Walk|Nature walk/i.test(i))&&canLeaveHome) suggestions.push({act:"Guided Nature Walk",where:"Chicago Botanic Garden, Glencoe",when:"Tuesdays & Saturdays 10am",type:"nature"});
  if(interests.some(i=>/Singing|Choir/i.test(i))) suggestions.push({act:"Community Choir",where:"Local church or community center",when:"Weekly rehearsals",type:"music"});
  if(interests.some(i=>/Cook|Bak/i.test(i))) suggestions.push({act:"Cooking Class for Seniors",where:"Local community center kitchen",when:"Monthly demos",type:"social"});
  if(faith&&/Catholic|Christian|Church/i.test(faith)) suggestions.push({act:"Parish Social Group",where:"Local Catholic/Christian church",when:"After Sunday service",type:"spiritual"});
  if(faith&&/Jewish|Temple|Synagogue/i.test(faith)) suggestions.push({act:"Synagogue Social",where:"Local synagogue",when:"Shabbat gatherings",type:"spiritual"});

  // Default suggestions if few interests matched
  if(suggestions.length<3){
    if(canLeaveHome) suggestions.push({act:"Senior Center Day Program",where:"Nearest CJE or Catholic Charities center",when:"Weekdays 9am-3pm",type:"social"});
    suggestions.push({act:"Phone Check-in Program",where:"CJE SeniorLife or Little Brothers",when:"Weekly scheduled calls",type:"social"});
    if(cogOk) suggestions.push({act:"Volunteer Visitor Program",where:"Through RSVP or faith community",when:"Weekly 1-hour visits",type:"social"});
  }

  const isolationRisk=interests.length<3||!canLeaveHome||!cogOk;

  return <div className="ai-card" style={{background:"linear-gradient(135deg,#0a1a0a,#001a0a)"}}>
    <h4><span className="pulse" style={{background:isolationRisk?"#8a7356":"#3c4f3d"}}/>Social Agent — Keeping {cl.name.split(" ")[0]} Active</h4>
    {isolationRisk&& <div style={{padding:"8px 12px",background:"rgba(138,115,86,.15)",marginBottom:10,fontSize:11,fontWeight:600,color:"#ffa94d"}}>⚠️ Social Isolation Risk: {interests.length<3?"Few recorded interests. ":""}{""}
      {!canLeaveHome?"Mobility limits outings. ":""}{!cogOk?"Cognitive status may limit participation. ":""}
      Recommend increasing social engagement frequency.
    </div>}
    <div style={{fontSize:11,opacity:.6,lineHeight:1.7,marginBottom:10}}>
      {interests.length} interests on file. {suggestions.length} activity matches found. {canLeaveHome?"Client can attend outings with transportation.":"Home-based activities recommended due to mobility."} {cogOk?"Cognitive status supports group participation.":"One-on-one activities preferred."}
    </div>
    {suggestions.slice(0,6).map((s,i)=> <div key={i} style={{display:"flex",gap:10,padding:"8px 0",borderTop:"1px solid rgba(255,255,255,.06)"}}>
      <div style={{fontSize:14,width:28,textAlign:"center"}}>{({social:"👥",music:"🎵",sports:"⚾",entertainment:"🎬",nature:"🌿",exercise:"🏃",arts:"🎨",culture:"🏛",spiritual:"⛪"})[s.type]||"📌"}</div>
      <div style={{flex:1}}><div style={{fontSize:12,fontWeight:600}}>{s.act}</div><div style={{fontSize:10,opacity:.4}}>{s.where} | {s.when}</div></div>
    </div>)}
  </div>;
}

// ─── ROLES & PERMISSIONS ────────────────────────────────────────────
const ROLES={
  owner:{label:"Owner",level:100,color:"#070707"},
  admin:{label:"Admin",level:80,color:"#3D3E3F"},
  manager:{label:"Manager",level:60,color:"#3c4f3d"},
  caregiver:{label:"Caregiver",level:20,color:"#3f4749"},
  client:{label:"Client",level:10,color:"#8a7356"},
  family:{label:"Family Member",level:5,color:"#4a3f5c"},
};

const PERMS={
  owner:["dash","schedule","clients","care","recon","expenses","training","recruiting","marketing","events","compliance","portal","family","team","users"],
  admin:["dash","schedule","clients","care","recon","expenses","training","recruiting","marketing","events","compliance","portal","family","team","users"],
  manager:["dash","schedule","clients","care","recon","expenses","training","events","compliance","family","team"],
  caregiver:["cg_home","cg_schedule","cg_clients","cg_notes","cg_expenses","cg_training","cg_messages"],
  client:["cl_home","cl_health","cl_goals","cl_schedule","cl_messages","cl_requests","cl_billing","cl_documents","cl_feedback"],
  family:["fm_home","fm_updates","fm_messages","fm_events"],
};

const USERS=[
  {id:"U1",email:"kip@cwinathome.com",pin:"1234",name:"Emmanuel Chepkwony",role:"owner",avatar:"EC",phone:"708-476-0021",title:"Owner / AVP",active:true},
  {id:"U2",email:"admin@cwinathome.com",pin:"4321",name:"Office Admin",role:"admin",avatar:"OA",phone:"708-476-0022",title:"Office Administrator",active:true},
  {id:"U3",email:"erolyn@cwinathome.com",pin:"1111",name:"Erolyn Francis",role:"caregiver",avatar:"EF",phone:"312-555-1001",title:"CNA",caregiverId:"CG1",active:true},
  {id:"U4",email:"faith@cwinathome.com",pin:"2222",name:"Faith Chepkwony",role:"caregiver",avatar:"FC",phone:"312-555-1002",title:"HHA",caregiverId:"CG2",active:true},
  {id:"U5",email:"olena@cwinathome.com",pin:"3333",name:"Olena Krutiak",role:"caregiver",avatar:"OK",phone:"773-555-1003",title:"CNA",caregiverId:"CG3",active:true},
  {id:"U6",email:"tiffany@cwinathome.com",pin:"4444",name:"Tiffany Brown",role:"caregiver",avatar:"TB",phone:"773-555-1004",title:"HHA",caregiverId:"CG4",active:true},
  {id:"U7",email:"becky.sutton@email.com",pin:"5555",name:"Becky Sutton",role:"client",avatar:"BS",phone:"312-555-0101",title:"Client",clientId:"CL1",active:true},
  {id:"U8",email:"linda.frank@email.com",pin:"6666",name:"Linda Frank",role:"client",avatar:"LF",phone:"773-555-0201",title:"Client",clientId:"CL2",active:true},
  {id:"U9",email:"steven.brown@email.com",pin:"7777",name:"Steven Brown",role:"client",avatar:"SB",phone:"773-555-0301",title:"Client",clientId:"CL3",active:true},
  {id:"U10",email:"tom.sutton@email.com",pin:"8888",name:"Tom Sutton",role:"family",avatar:"TS",phone:"312-555-0102",title:"Son of Becky Sutton",clientId:"CL1",active:true},
  {id:"U11",email:"mike.frank@email.com",pin:"9999",name:"Mike Frank",role:"family",avatar:"MF",phone:"773-555-0202",title:"Nephew of Linda Frank",clientId:"CL2",active:true},
  {id:"U12",email:"janet.brown@email.com",pin:"0000",name:"Janet Brown",role:"family",avatar:"JB",phone:"773-555-0302",title:"Wife of Steven Brown",clientId:"CL3",active:true},
];
const uid=()=>Math.random().toString(36).slice(2,9);
const $=n=>"$"+Number(n||0).toFixed(2);
const now=()=>new Date();
const fmtD=d=>new Date(d).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"});
const fmtT=d=>new Date(d).toLocaleTimeString("en-US",{hour:"numeric",minute:"2-digit"});
const fmtRel=d=>{const ms=now()-new Date(d);const m=Math.floor(ms/60000);if(m<60)return`${m}m ago`;const h=Math.floor(m/60);if(h<24)return`${h}h ago`;return`${Math.floor(h/24)}d ago`;};
const hrsMin=mins=>{const h=Math.floor(mins/60);const m=mins%60;return `${h}h ${m}m`;};
const MILEAGE_RATE=0.67;
const EXP_CATEGORIES=["Mileage","Groceries","Pharmacy","Supplies","Transportation","Client Meals","Other"];

// ─── GPS SIMULATION ─────────────────────────────────────────────────
const GPS_LOCATIONS={
  CL1:{lat:41.8992,lng:-87.6233,addr:"30 E Elm St, Chicago IL 60611",name:"Becky Sutton"},
  CL2:{lat:41.9517,lng:-87.6547,addr:"3930 N Pine Grove Ave, Chicago IL 60613",name:"Linda Frank"},
  CL3:{lat:41.9714,lng:-87.6536,addr:"4920 N Marine Dr, Chicago IL 60640",name:"Steven Brown"},
};
const simGPS=(base)=>{const j=()=>(Math.random()-.5)*.002;return{lat:base.lat+j(),lng:base.lng+j(),accuracy:5+Math.random()*12,ts:now()};};
const gpsAddr=(lat,lng)=>{const closest=Object.values(GPS_LOCATIONS).reduce((best,loc)=>{const d=Math.abs(loc.lat-lat)+Math.abs(loc.lng-lng);return d<best.d?{d,loc}:best;},{d:Infinity,loc:null});return closest.d<0.01?closest.loc.addr:`${lat.toFixed(4)}°N, ${Math.abs(lng).toFixed(4)}°W`;};
const gpsDist=(a,b)=>{const R=3959;const dLat=(b.lat-a.lat)*Math.PI/180;const dLon=(b.lng-a.lng)*Math.PI/180;const x=Math.sin(dLat/2)**2+Math.cos(a.lat*Math.PI/180)*Math.cos(b.lat*Math.PI/180)*Math.sin(dLon/2)**2;return R*2*Math.atan2(Math.sqrt(x),Math.sqrt(1-x));};
const today=()=>now().toISOString().split("T")[0];

// ─── SEED: CLIENTS ──────────────────────────────────────────────────
const CLIENTS=[
  {id:"CL1",name:"Becky Sutton",age:78,addr:"30 E Elm St, Chicago IL 60611",phone:"312-555-0101",emergency:"Tom Sutton (son) 312-555-0102",
   dx:["Mild cognitive impairment","Hypertension","Osteoarthritis"],meds:["Lisinopril 10mg","Donepezil 5mg","Acetaminophen PRN"],
   adl:{bathing:"Standby assist — caregiver present for safety, verbal cues only",dressing:"Independent — selects clothes and dresses without assistance",eating:"Independent — feeds self without assistance",toileting:"Independent — uses toilet without assistance, manages clothing",mobility:"Independent with device — uses cane independently",transferring:"Independent — moves in/out of bed, chair, toilet without help",continence:"Continent — full bowel and bladder control",cognition:"Intact — alert, oriented x4 (person, place, time, situation)"},
   social:{interests:["Bridge club","Classical music","Gardening","Reading mystery novels"],faith:"Episcopal",pets:"Cat named Whiskers",birthday:"1947-08-14"},
   preferences:{wakeTime:"7:30 AM",bedTime:"9:00 PM",tea:"Earl Grey with honey",diet:"Low sodium",tvShows:["Jeopardy","PBS NewsHour"]},
   familyPortal:{enabled:true,contacts:[{name:"Tom Sutton",relation:"Son",email:"tom.sutton@email.com",access:["daily_notes","medications","schedule"]},{name:"Sarah Sutton",relation:"Daughter-in-law",email:"sarah.s@email.com",access:["daily_notes","schedule"]}]},
   status:"active",riskLevel:"low",billRate:50},
  {id:"CL2",name:"Linda Frank",age:84,addr:"3930 N Pine Grove Ave, Chicago IL 60613",phone:"773-555-0201",emergency:"Mike Frank (nephew) 773-555-0202",
   dx:["CHF (NYHA Class II)","Type 2 Diabetes","Chronic back pain","Depression"],meds:["Metformin 500mg","Furosemide 20mg","Sertraline 50mg","Carvedilol 12.5mg","Gabapentin 300mg"],
   adl:{bathing:"Moderate assist (50%) — needs hands-on help with washing upper or lower body",dressing:"Minimal assist (25%) — needs help with buttons, zippers, or back closures",eating:"Independent with setup — needs meal cut, containers opened, tray positioned",toileting:"Standby assist — needs someone nearby for transfers or balance",mobility:"Fall risk — ambulatory but history of falls, requires precautions",transferring:"Minimal assist (25%) — needs steadying or light support during pivot",continence:"Managed with scheduled toileting — continent when prompted",cognition:"Moderate impairment — needs reminders for daily tasks, supervision recommended"},
   social:{interests:["Watching old movies","Phone calls with friends","Crossword puzzles","Dog care"],faith:"Catholic",pets:"Dog named Buddy",birthday:"1941-11-22"},
   preferences:{wakeTime:"8:00 AM",bedTime:"10:00 PM",tea:"Chamomile",diet:"Diabetic, cardiac",tvShows:["TCM classics","The Price is Right"]},
   familyPortal:{enabled:true,contacts:[{name:"Mike Frank",relation:"Nephew",email:"mike.frank@email.com",access:["daily_notes","medications","incidents","schedule","health_vitals"]}]},
   status:"active",riskLevel:"medium",billRate:35},
  {id:"CL3",name:"Steven Brown",age:72,addr:"4920 N Marine Dr, Chicago IL 60640",phone:"773-555-0301",emergency:"Janet Brown (wife) 773-555-0302",
   dx:["Parkinson's disease (Stage 2)","Mild depression","Benign prostatic hyperplasia"],meds:["Carbidopa-Levodopa 25/100","Tamsulosin 0.4mg","Escitalopram 10mg"],
   adl:{bathing:"Minimal assist (25%) — can do most of task, needs help with one body part (e.g. back, feet)",dressing:"Minimal assist due to tremor — fine motor difficulty with fasteners",eating:"Independent with adaptive equipment — uses built-up utensils, plate guard, etc.",toileting:"Independent with equipment — uses raised seat, grab bars, or commode",mobility:"Slow gait, balance issues — ambulatory with gait abnormality",transferring:"Standby assist — caregiver within arm's reach, no contact unless needed",continence:"Occasionally incontinent — accidents less than weekly",cognition:"Mild cognitive impairment (MCI) — diagnosed, memory lapses, judgment intact"},
   social:{interests:["Jazz music","Chess","Watching Cubs games","Reading history books"],faith:"Baptist",pets:"None",birthday:"1953-05-30"},
   preferences:{wakeTime:"7:00 AM",bedTime:"9:30 PM",tea:"Black coffee, 1 sugar",diet:"Regular",tvShows:["Cubs games","60 Minutes","History Channel"]},
   familyPortal:{enabled:true,contacts:[{name:"Janet Brown",relation:"Wife",email:"janet.brown@email.com",access:["daily_notes","medications","incidents","schedule","health_vitals","expenses"]}]},
   status:"active",riskLevel:"medium",billRate:35},
];

// ─── SEED: CAREGIVERS ───────────────────────────────────────────────
const CAREGIVERS=[
  {id:"CG1",name:"Erolyn Francis",email:"erolyn@cwinathome.com",phone:"312-555-1001",rate:35,certs:["CNA","CPR/BLS","Alzheimer's Care"],hireDate:"2024-06-15",status:"active",avatar:"EF",trainingComplete:8,trainingTotal:12},
  {id:"CG2",name:"Faith Chepkwony",email:"faith@cwinathome.com",phone:"312-555-1002",rate:20,certs:["HHA","CPR/BLS"],hireDate:"2025-01-10",status:"active",avatar:"FC",trainingComplete:5,trainingTotal:12},
  {id:"CG3",name:"Olena Krutiak",email:"olena@cwinathome.com",phone:"773-555-1003",rate:20,certs:["CNA","CPR/BLS","Parkinson's Care"],hireDate:"2024-09-01",status:"active",avatar:"OK",trainingComplete:10,trainingTotal:12},
  {id:"CG4",name:"Tiffany Brown",email:"tiffany@cwinathome.com",phone:"773-555-1004",rate:20,certs:["HHA","CPR/BLS","First Aid"],hireDate:"2024-11-20",status:"active",avatar:"TB",trainingComplete:7,trainingTotal:12},
];

// ─── SEED: TRAINING MODULES ─────────────────────────────────────────
const TRAINING_MODULES=[
  {id:"TM1",title:"Client Rights & Dignity",category:"Compliance",duration:"45 min",difficulty:"Essential",description:"Understanding client rights, privacy (HIPAA), informed consent, and maintaining dignity in daily care.",lessons:["Client Bill of Rights","HIPAA for Home Care","Informed Consent Basics","Cultural Sensitivity","Reporting Rights Violations"],quiz:[{q:"A client's family asks about their medication list. Can you share it?",opts:["Yes, family always has access","Only if the client has given written consent","Only if they seem concerned","Yes, for immediate family"],a:1},{q:"What is the FIRST thing to do when entering a client's home?",opts:["Start cleaning immediately","Greet the client and ask how they're doing","Check medications","Call the office"],a:1}],status:"published"},
  {id:"TM2",title:"Fall Prevention & Safety",category:"Safety",duration:"60 min",difficulty:"Essential",description:"Identifying fall risks, environmental modifications, transfer techniques, and emergency response for falls.",lessons:["Home Hazard Assessment","Safe Transfer Techniques","Assistive Device Use","Post-Fall Protocol","Documentation Requirements"],quiz:[{q:"You find your client on the floor. What do you do FIRST?",opts:["Pick them up immediately","Call 911","Assess for injuries and consciousness","Call the office"],a:2},{q:"Which is NOT a fall risk factor?",opts:["Throw rugs","Adequate lighting","Wet floors","Cluttered walkways"],a:1}],status:"published"},
  {id:"TM3",title:"Medication Reminders & Safety",category:"Clinical",duration:"50 min",difficulty:"Essential",description:"Understanding medication schedules, proper reminders (not administration), recognizing side effects, and documentation.",lessons:["Scope of Practice: Reminders vs Administration","Reading Medication Labels","Common Side Effects to Watch For","When to Call the Nurse/MD","Medication Documentation"],quiz:[{q:"As a home care aide, you can:",opts:["Administer medications","Crush pills and mix in food","Remind clients to take their medications","Change medication dosages"],a:2}],status:"published"},
  {id:"TM4",title:"Infection Control & PPE",category:"Safety",duration:"40 min",difficulty:"Essential",description:"Hand hygiene, PPE use, bloodborne pathogens, cleaning protocols, and COVID-19 precautions.",lessons:["Hand Hygiene (WHO 5 Moments)","PPE Donning & Doffing","Bloodborne Pathogen Standard","Cleaning & Disinfection","Respiratory Illness Protocols"],quiz:[],status:"published"},
  {id:"TM5",title:"Dementia & Alzheimer's Care",category:"Clinical",duration:"90 min",difficulty:"Advanced",description:"Understanding dementia stages, communication techniques, behavioral management, wandering prevention, and caregiver self-care.",lessons:["Types of Dementia","Communication Strategies","Managing Sundowning","Wandering Prevention","Meaningful Activities","Caregiver Burnout Prevention"],quiz:[],status:"published"},
  {id:"TM6",title:"Nutrition & Meal Preparation",category:"Daily Living",duration:"55 min",difficulty:"Core",description:"Therapeutic diets, safe food handling, meal planning for common conditions, and feeding assistance techniques.",lessons:["Diabetic Diet Basics","Cardiac/Low Sodium Diet","Safe Food Handling","Texture-Modified Diets","Hydration Monitoring"],quiz:[],status:"published"},
  {id:"TM7",title:"Personal Care & Hygiene",category:"Daily Living",duration:"60 min",difficulty:"Core",description:"Bathing, grooming, oral care, skin inspection, and maintaining client comfort and dignity.",lessons:["Bathing Techniques & Safety","Skin Inspection & Pressure Sore Prevention","Oral Care","Hair & Nail Care","Incontinence Care"],quiz:[],status:"published"},
  {id:"TM8",title:"Vital Signs & Health Monitoring",category:"Clinical",duration:"45 min",difficulty:"Core",description:"Taking and recording blood pressure, temperature, pulse, respiration, blood glucose, and recognizing abnormal values.",lessons:["Blood Pressure Measurement","Pulse & Respiration","Temperature","Blood Glucose Monitoring","When to Report: Red Flags"],quiz:[],status:"published"},
  {id:"TM9",title:"Emergency Response",category:"Safety",duration:"50 min",difficulty:"Essential",description:"CPR review, choking response, stroke recognition (FAST), diabetic emergencies, and when to call 911.",lessons:["CPR/AED Review","Choking: Heimlich Maneuver","Stroke Recognition (FAST)","Diabetic Emergencies","Seizure Response","Emergency Contact Protocols"],quiz:[],status:"published"},
  {id:"TM10",title:"Documentation & Reporting",category:"Compliance",duration:"40 min",difficulty:"Core",description:"Proper care note documentation, incident reporting, time tracking, and communicating with the care team.",lessons:["Writing Effective Care Notes","Incident Report Procedures","Time Tracking Best Practices","SBAR Communication","Mandatory Reporting Obligations"],quiz:[],status:"published"},
  {id:"TM11",title:"Parkinson's Disease Care",category:"Clinical",duration:"75 min",difficulty:"Advanced",description:"Understanding Parkinson's progression, movement assistance, medication timing, speech and swallowing issues.",lessons:["Parkinson's Disease Overview","Movement & Mobility Assistance","Medication Timing Importance","Speech & Swallowing Support","Emotional & Psychological Support"],quiz:[],status:"published"},
  {id:"TM12",title:"End-of-Life & Palliative Care",category:"Clinical",duration:"60 min",difficulty:"Advanced",description:"Comfort care principles, recognizing end-of-life signs, family support, grief, and self-care for caregivers.",lessons:["Palliative vs Hospice Care","Comfort Measures","Recognizing End-of-Life Signs","Supporting Families","Caregiver Grief & Self-Care"],quiz:[],status:"published"},
];

// ─── SEED: TASKS, CHORES, EVENTS ────────────────────────────────────
const seedChores=[
  {id:"CH1",clientId:"CL1",title:"Light housekeeping",frequency:"Every visit",priority:"routine",status:"active",lastDone:today(),assignedTo:"CG1"},
  {id:"CH2",clientId:"CL1",title:"Laundry (wash, dry, fold)",frequency:"2x/week",priority:"routine",status:"active",lastDone:"2026-03-07",assignedTo:"CG1"},
  {id:"CH3",clientId:"CL2",title:"Grocery shopping",frequency:"Weekly",priority:"routine",status:"active",lastDone:"2026-03-04",assignedTo:"CG4"},
  {id:"CH4",clientId:"CL2",title:"Dog care (walk Buddy, feed)",frequency:"Every visit",priority:"high",status:"active",lastDone:today(),assignedTo:"CG4"},
  {id:"CH5",clientId:"CL2",title:"Change bedding",frequency:"Weekly",priority:"routine",status:"active",lastDone:"2026-03-01",assignedTo:"CG4"},
  {id:"CH6",clientId:"CL3",title:"Medication pickup (CVS)",frequency:"Monthly",priority:"high",status:"active",lastDone:"2026-02-25",assignedTo:"CG3"},
  {id:"CH7",clientId:"CL3",title:"Light meal prep",frequency:"Every visit",priority:"routine",status:"active",lastDone:today(),assignedTo:"CG3"},
];

const seedIncidents=[
  {id:"IR1",clientId:"CL2",caregiverId:"CG2",date:"2026-02-28T15:15:00",type:"Emergency Call",severity:"medium",description:"Client reported chest tightness. Vitals: BP 158/92, HR 88. Called MD office, advised to monitor. Resolved after rest and medication.",status:"resolved",followUp:"MD follow-up scheduled 3/5",familyNotified:true},
  {id:"IR2",clientId:"CL2",caregiverId:"CG4",date:"2026-03-03T14:30:00",type:"Near Fall",severity:"low",description:"Client stumbled when transitioning from bed to walker. Caught by caregiver. No injury. Walker brake was not engaged.",status:"resolved",followUp:"Reinforced walker brake check protocol",familyNotified:false},
  {id:"IR3",clientId:"CL3",caregiverId:"CG3",date:"2026-03-06T10:45:00",type:"Medication Issue",severity:"medium",description:"Client reported missing morning dose of Carbidopa-Levodopa. Increased tremor noted. Contacted MD, advised to take dose immediately.",status:"open",followUp:"Pill organizer refill audit needed",familyNotified:true},
];

const seedCareNotes=[
  {id:"CN1",clientId:"CL1",caregiverId:"CG1",date:"2026-03-09T10:00:00",category:"General",text:"Client in good spirits. Prepared Earl Grey tea, assisted with light housekeeping. Watched Jeopardy together. Reminded about medications."},
  {id:"CN2",clientId:"CL2",caregiverId:"CG4",date:"2026-03-08T13:00:00",category:"Health",text:"Helped with shower, changed bedding. BP 142/86. Client reports sleeping better this week. Buddy had his walk. Prepared lunch (low sodium chicken soup)."},
  {id:"CN3",clientId:"CL2",caregiverId:"CG4",date:"2026-03-04T12:00:00",category:"ADL",text:"Breakfast prep, helped set up Medicare online account, business calls, mail sorting, grocery shopping. Client engaged and cooperative."},
  {id:"CN4",clientId:"CL3",caregiverId:"CG3",date:"2026-03-09T09:00:00",category:"Health",text:"Tremor slightly increased today, may be related to missed dose yesterday. Gait steady with cane. Prepared breakfast, assisted with dressing (buttons difficult due to tremor)."},
  {id:"CN5",clientId:"CL2",caregiverId:"CG4",date:"2026-03-01T13:00:00",category:"ADL",text:"Shower assistance, changed bedding, helped install new light fixture, created Social Security online account, light cleaning, rearranged living room chair for better access."},
];

const seedExpenses=[
  {id:"EX1",caregiverId:"CG4",clientId:"CL2",date:"2026-03-04",category:"Groceries",description:"Weekly groceries for Linda (Jewel-Osco)",amount:67.42,receipt:true,status:"approved",gps:"Jewel-Osco, 3531 N Broadway, Chicago"},
  {id:"EX2",caregiverId:"CG3",clientId:"CL3",date:"2026-02-25",category:"Pharmacy",description:"Medication pickup CVS - copay for Carbidopa-Levodopa",amount:15.00,receipt:true,status:"approved",gps:"CVS, 5205 N Broadway, Chicago"},
  {id:"EX3",caregiverId:"CG4",clientId:"CL2",date:"2026-03-01",category:"Supplies",description:"Light fixture + bulbs for bedroom",amount:24.99,receipt:true,status:"pending",gps:"Home Depot, 2570 N Elston Ave, Chicago"},
  {id:"EX4",caregiverId:"CG1",clientId:"CL1",date:"2026-03-06",category:"Transportation",description:"Uber to client (car in shop)",amount:18.50,receipt:true,status:"approved",gps:""},
  {id:"EX5",caregiverId:"CG3",clientId:"CL3",date:"2026-03-05",category:"Mileage",description:"Round trip home to client",amount:12.06,receipt:false,status:"pending",gps:""},
];

const seedEvents=[
  {id:"EV1",clientId:"CL2",title:"Dr. Appointment - Rush Oak Park",date:"2026-03-14T14:00:00",type:"medical",notes:"Annual cardiology follow-up. Need transportation."},
  {id:"EV2",clientId:"CL3",title:"Parkinson's Support Group",date:"2026-03-15T10:00:00",type:"social",notes:"Monthly group at Northwestern. Janet usually drives."},
  {id:"EV3",clientId:"CL1",title:"Bridge Club",date:"2026-03-12T13:00:00",type:"social",notes:"At community center. Client can get there independently."},
  {id:"EV4",clientId:"CL1",title:"Eye Doctor - Routine",date:"2026-03-20T09:30:00",type:"medical",notes:"Dr. Kim, 680 N Lake Shore Dr. Needs ride."},
  {id:"EV5",clientId:"CL3",title:"Cubs Opening Day Watch Party",date:"2026-03-26T13:00:00",type:"social",notes:"AI-suggested: Steven loves Cubs games. Local bar has accessible viewing."},
  {id:"EV6",clientId:"CL2",title:"Classic Movie Night - Music Box Theatre",date:"2026-03-21T19:00:00",type:"social",notes:"AI-suggested: Linda loves old movies. Casablanca screening. Wheelchair accessible."},
];

const seedFamilyMessages=[
  {id:"FM1",clientId:"CL2",from:"Mike Frank",fromType:"family",date:"2026-03-08T09:15:00",text:"How was Linda doing this weekend? She mentioned feeling tired on our call."},
  {id:"FM2",clientId:"CL2",from:"Tiffany Brown",fromType:"caregiver",date:"2026-03-08T14:30:00",text:"Hi Mike, Linda had a good day today. BP was 142/86, which is improved. She did mention being tired but perked up after lunch. We did a full shower and she was in great spirits watching TCM this afternoon."},
  {id:"FM3",clientId:"CL3",from:"Janet Brown",fromType:"family",date:"2026-03-07T11:00:00",text:"Olena, has Steven been taking his Parkinson's meds on time? His tremor seemed worse when I visited yesterday."},
  {id:"FM4",clientId:"CL3",from:"Olena Krutiak",fromType:"caregiver",date:"2026-03-07T16:20:00",text:"Hi Janet, I noticed the same thing. He missed his morning dose on the 6th. I've filed an incident report and we're setting up a better pill organizer system. Dr. Chen has been notified."},
];

// ─── SEED: CLIENT PORTAL ────────────────────────────────────────────
const seedServiceRequests=[
  {id:"SR1",clientId:"CL1",date:"2026-03-07T10:00:00",type:"Schedule Change",description:"I'd like my Wednesday visit moved to Thursday this week. I have a bridge tournament.",status:"approved",response:"Done! Erolyn will visit Thursday 8am-2pm instead.",respondedAt:"2026-03-07T11:30:00"},
  {id:"SR2",clientId:"CL2",date:"2026-03-05T14:00:00",type:"Supply Request",description:"Running low on disposable gloves and hand sanitizer. Also need new bed pads.",status:"completed",response:"Supplies delivered by Tiffany on 3/6. Receipt submitted.",respondedAt:"2026-03-06T09:00:00"},
  {id:"SR3",clientId:"CL3",date:"2026-03-08T09:00:00",type:"Caregiver Feedback",description:"Olena has been wonderful. Very patient with my tremor and always on time. Please tell her I appreciate her.",status:"acknowledged",response:"Thank you, Steven! We've shared your kind words with Olena. She was very touched.",respondedAt:"2026-03-08T16:00:00"},
  {id:"SR4",clientId:"CL2",date:"2026-03-09T08:00:00",type:"Schedule Change",description:"Can we add an extra visit on Saturday for help with spring cleaning?",status:"pending",response:"",respondedAt:""},
  {id:"SR5",clientId:"CL1",date:"2026-03-04T11:00:00",type:"Concern",description:"My caregiver left 15 minutes early last Tuesday. Not a huge deal but wanted to mention it.",status:"resolved",response:"Thank you for letting us know, Becky. We've reviewed the time records and spoken with Erolyn. This has been addressed.",respondedAt:"2026-03-04T15:00:00"},
];

const seedSurveys=[
  {id:"SV1",clientId:"CL1",date:"2026-03-01",ratings:{overall:5,punctuality:5,communication:5,skills:4,respect:5,reliability:5},comments:"Erolyn is absolutely wonderful. She knows exactly how I like my tea and is always cheerful. I feel very comfortable with her.",caregiver:"CG1"},
  {id:"SV2",clientId:"CL2",date:"2026-03-01",ratings:{overall:4,punctuality:4,communication:5,skills:5,respect:5,reliability:4},comments:"Tiffany is great with Buddy and very thorough with my medications. Sometimes she runs a bit late but always calls ahead.",caregiver:"CG4"},
  {id:"SV3",clientId:"CL3",date:"2026-03-01",ratings:{overall:5,punctuality:5,communication:5,skills:5,respect:5,reliability:5},comments:"Olena understands Parkinson's very well. She never rushes me and adapts to my good and bad days. Exceptional care.",caregiver:"CG3"},
  {id:"SV4",clientId:"CL1",date:"2026-02-01",ratings:{overall:5,punctuality:5,communication:4,skills:5,respect:5,reliability:5},comments:"Very satisfied with care. Would appreciate a bit more advance notice if schedule changes.",caregiver:"CG1"},
];

const seedCareGoals=[
  {id:"CG01",clientId:"CL1",title:"Maintain independent dressing",category:"ADL",target:"Continue independent dressing 5+ days/week",progress:90,status:"on-track",notes:"Becky dresses independently every day. Occasional help with back zippers."},
  {id:"CG02",clientId:"CL1",title:"Social engagement",category:"Wellness",target:"Attend 2+ social activities per month",progress:100,status:"achieved",notes:"Attending bridge club weekly and gardening group monthly."},
  {id:"CG03",clientId:"CL2",title:"Fall prevention",category:"Safety",target:"Zero falls for 90 days",progress:60,status:"at-risk",notes:"One near-fall on 3/3. Walker brake protocol reinforced. 45 days since last incident."},
  {id:"CG04",clientId:"CL2",title:"Blood pressure management",category:"Health",target:"BP consistently below 150/90",progress:75,status:"on-track",notes:"Trending downward. Last reading 142/86. Diet compliance improving."},
  {id:"CG05",clientId:"CL3",title:"Medication adherence",category:"Health",target:"100% on-time medication for 30 days",progress:40,status:"at-risk",notes:"Missed dose on 3/6. Pill organizer system being set up."},
  {id:"CG06",clientId:"CL3",title:"Physical activity",category:"Wellness",target:"15 min daily movement/exercise",progress:80,status:"on-track",notes:"Doing chair exercises 5x/week. Walks to mailbox daily."},
];

const seedVitals=[
  {id:"V1",clientId:"CL2",date:"2026-03-09",bp:"138/84",hr:76,temp:"98.4",glucose:142,weight:168,notes:"Good day, client reports feeling well",recordedBy:"CG4"},
  {id:"V2",clientId:"CL2",date:"2026-03-08",bp:"142/86",hr:78,temp:"98.2",glucose:156,weight:168,notes:"Slightly elevated glucose after birthday cake yesterday",recordedBy:"CG4"},
  {id:"V3",clientId:"CL2",date:"2026-03-04",bp:"148/88",hr:82,temp:"98.6",glucose:138,weight:169,notes:"",recordedBy:"CG4"},
  {id:"V4",clientId:"CL2",date:"2026-03-01",bp:"145/87",hr:80,temp:"98.4",glucose:145,weight:169,notes:"",recordedBy:"CG4"},
  {id:"V5",clientId:"CL3",date:"2026-03-09",bp:"128/78",hr:68,temp:"98.2",glucose:null,weight:182,notes:"Tremor slightly increased, may be related to missed dose",recordedBy:"CG3"},
  {id:"V6",clientId:"CL3",date:"2026-03-06",bp:"124/76",hr:66,temp:"98.4",glucose:null,weight:182,notes:"Good day, steady gait",recordedBy:"CG3"},
  {id:"V7",clientId:"CL1",date:"2026-03-09",bp:"132/80",hr:72,temp:"98.6",glucose:null,weight:145,notes:"Excellent spirits",recordedBy:"CG1"},
];

const seedDocuments=[
  {id:"D1",clientId:"CL1",name:"Care Plan - Q1 2026",type:"care_plan",date:"2026-01-15",size:"2.4 MB"},
  {id:"D2",clientId:"CL1",name:"Signed Service Agreement",type:"agreement",date:"2024-06-01",size:"1.1 MB"},
  {id:"D3",clientId:"CL2",name:"Care Plan - Q1 2026",type:"care_plan",date:"2026-01-15",size:"3.1 MB"},
  {id:"D4",clientId:"CL2",name:"Cardiology Report - Feb 2026",type:"medical",date:"2026-02-20",size:"890 KB"},
  {id:"D5",clientId:"CL2",name:"Signed Service Agreement",type:"agreement",date:"2024-09-01",size:"1.1 MB"},
  {id:"D6",clientId:"CL3",name:"Care Plan - Q1 2026",type:"care_plan",date:"2026-01-15",size:"2.8 MB"},
  {id:"D7",clientId:"CL3",name:"Parkinson's Treatment Summary",type:"medical",date:"2026-01-10",size:"1.5 MB"},
  {id:"D8",clientId:"CL3",name:"Signed Service Agreement",type:"agreement",date:"2024-09-01",size:"1.1 MB"},
];

// ─── SEED: RECRUITING ───────────────────────────────────────────────
const seedCGApplicants=[
  {id:"AP1",name:"Diana Rodriguez",email:"diana.r@email.com",phone:"312-555-2001",certs:["CNA","CPR/BLS"],experience:"3 years home care, 2 years assisted living",availability:"Full-time",preferredAreas:["North Side","Lincoln Park"],status:"interview",appliedDate:"2026-03-01",notes:"Strong references, bilingual English/Spanish",bgCheck:"pending",source:"Indeed"},
  {id:"AP2",name:"Marcus Johnson",email:"marcus.j@email.com",phone:"773-555-2002",certs:["HHA"],experience:"1 year home care",availability:"Part-time weekends",preferredAreas:["South Side","Hyde Park"],status:"screening",appliedDate:"2026-03-05",notes:"Currently in CNA program, graduates May 2026",bgCheck:"not_started",source:"Referral (Tiffany Brown)"},
  {id:"AP3",name:"Aisha Okafor",email:"aisha.o@email.com",phone:"312-555-2003",certs:["CNA","CPR/BLS","Dementia Care","Wound Care"],experience:"7 years home care, hospice experience",availability:"Full-time",preferredAreas:["Lakeview","Gold Coast","Lincoln Park"],status:"offer",appliedDate:"2026-02-20",notes:"Exceptional candidate. Hospice and wound care experience rare.",bgCheck:"passed",source:"LinkedIn"},
  {id:"AP4",name:"Chen Wei",email:"chen.w@email.com",phone:"773-555-2004",certs:["HHA","CPR/BLS"],experience:"2 years, agency experience",availability:"Full-time",preferredAreas:["Uptown","Edgewater"],status:"new",appliedDate:"2026-03-08",notes:"Mandarin speaker, good reviews from previous agency",bgCheck:"not_started",source:"CWINathome.com"},
];

const seedClientLeads=[
  {id:"LD1",name:"Dorothy Martinez",age:81,phone:"312-555-3001",referralSource:"Rush Hospital Discharge",needs:"Post-hip replacement, 4-6 weeks ADL assistance",hoursNeeded:"6 hrs/day, 5 days/week",status:"assessment",assessmentDate:"2026-03-12",notes:"Daughter Maria is POA. Insurance: Medicare + BCBS supplement.",urgency:"high"},
  {id:"LD2",name:"Harold Kim",age:76,phone:"773-555-3002",referralSource:"Dr. Susan Park (Neurologist)",needs:"Early-stage Alzheimer's, companionship and safety monitoring",hoursNeeded:"4 hrs/day, 3 days/week",status:"inquiry",assessmentDate:"",notes:"Wife works full-time, needs daytime coverage. Lives in Skokie.",urgency:"medium"},
  {id:"LD3",name:"Patricia O'Brien",age:88,phone:"312-555-3003",referralSource:"Family self-referral (website)",needs:"Full personal care, meals, housekeeping. Lives alone.",hoursNeeded:"8 hrs/day, 7 days/week",status:"proposal",assessmentDate:"2026-03-08",notes:"Assessment complete. Proposing $45/hr. Son James reviewing contract.",urgency:"high"},
  {id:"LD4",name:"George Washington III",age:70,phone:"773-555-3004",referralSource:"Veterans Affairs",needs:"Parkinson's care, medication management, mobility assistance",hoursNeeded:"4 hrs/day, 5 days/week",status:"new",assessmentDate:"",notes:"VA may cover partial cost. Needs Parkinson's-trained caregiver.",urgency:"medium"},
];

// ─── SEED: COMPLIANCE ───────────────────────────────────────────────
const seedComplianceItems=[
  {id:"CO1",type:"Background Check",entity:"Erolyn Francis",entityType:"caregiver",dueDate:"2026-06-15",status:"current",notes:"Annual renewal due June"},
  {id:"CO2",type:"CPR/BLS Certification",entity:"Faith Chepkwony",entityType:"caregiver",dueDate:"2026-04-10",status:"expiring_soon",notes:"30 days until expiration"},
  {id:"CO3",type:"TB Test",entity:"Olena Krutiak",entityType:"caregiver",dueDate:"2026-03-20",status:"overdue",notes:"Was due March 20, needs scheduling ASAP"},
  {id:"CO4",type:"Service Agreement",entity:"Becky Sutton",entityType:"client",dueDate:"2026-06-01",status:"current",notes:"Annual renewal"},
  {id:"CO5",type:"Care Plan Review",entity:"Linda Frank",entityType:"client",dueDate:"2026-03-15",status:"expiring_soon",notes:"Quarterly review due, needs MD signature"},
  {id:"CO6",type:"HIPAA Training",entity:"All Staff",entityType:"company",dueDate:"2026-04-01",status:"expiring_soon",notes:"Annual company-wide HIPAA refresher"},
  {id:"CO7",type:"W-9 on File",entity:"Tiffany Brown",entityType:"caregiver",dueDate:"2026-12-31",status:"current",notes:"Updated January 2026"},
  {id:"CO8",type:"Liability Insurance",entity:"CWIN At Home LLC",entityType:"company",dueDate:"2026-09-01",status:"current",notes:"Policy #HC-2024-8891"},
  {id:"CO9",type:"Workers Comp",entity:"CWIN At Home LLC",entityType:"company",dueDate:"2026-09-01",status:"current",notes:"Policy #WC-2024-3344"},
  {id:"CO10",type:"Background Check",entity:"Tiffany Brown",entityType:"caregiver",dueDate:"2026-05-20",status:"expiring_soon",notes:"Annual renewal due May"},
];

// ─── SEED: RECONCILIATION ───────────────────────────────────────────
const seedReconEntries=[
  {id:"RC1",caregiverId:"CG1",clientId:"CL1",date:"2026-03-09",scheduled:{start:"09:00",end:"15:00",hours:6},actual:{clockIn:"09:43",clockOut:"15:13",hours:5.5},gpsIn:"E Elm St, 30, Chicago",gpsOut:"E Elm St, 18, Chicago",gpsMatch:true,variance:-0.5,flags:["LATE_ARRIVAL"],billRate:50,payRate:35,billedAmount:275,paidAmount:192.5,margin:82.5,status:"review"},
  {id:"RC2",caregiverId:"CG1",clientId:"CL1",date:"2026-03-06",scheduled:{start:"09:00",end:"16:00",hours:7},actual:{clockIn:"10:03",clockOut:"16:04",hours:6.02},gpsIn:"E Elm St, 30, Chicago",gpsOut:"E Elm St, 22, Chicago",gpsMatch:true,variance:-0.98,flags:["LATE_ARRIVAL","SHORT_SHIFT"],billRate:50,payRate:35,billedAmount:301,paidAmount:210.58,margin:90.42,status:"flagged"},
  {id:"RC3",caregiverId:"CG3",clientId:"CL3",date:"2026-03-09",scheduled:{start:"08:00",end:"13:00",hours:5},actual:{clockIn:"08:55",clockOut:"13:07",hours:4.2},gpsIn:"N Marine Dr, 4920, Chicago",gpsOut:"N Marine Dr, 4920, Chicago",gpsMatch:true,variance:-0.8,flags:[],billRate:35,payRate:20,billedAmount:147,paidAmount:84,margin:63,status:"approved"},
  {id:"RC4",caregiverId:"CG4",clientId:"CL2",date:"2026-03-08",scheduled:{start:"12:00",end:"20:00",hours:8},actual:{clockIn:"12:17",clockOut:"19:29",hours:7.2},gpsIn:"Linda Frank",gpsOut:"N Lake Shore Dr, 3778, Chicago",gpsMatch:false,variance:-0.8,flags:["GPS_MISMATCH_OUT","ADMIN_EDITED"],billRate:35,payRate:20,billedAmount:252,paidAmount:144,margin:108,status:"review"},
  {id:"RC5",caregiverId:"CG2",clientId:"CL2",date:"2026-02-28",scheduled:{start:"15:00",end:"17:00",hours:2},actual:{clockIn:"15:15",clockOut:"17:15",hours:2},gpsIn:"Linda Frank",gpsOut:"Updated by admin",gpsMatch:false,variance:0,flags:["EMERGENCY","ADMIN_EDITED"],billRate:35,payRate:20,billedAmount:70,paidAmount:0,margin:70,status:"approved"},
];

// ─── SEED: MARKETING ────────────────────────────────────────────────
const seedCampaigns=[
  {id:"MK1",name:"Spring Home Care Awareness",channel:"Facebook/Instagram",status:"active",startDate:"2026-03-01",endDate:"2026-03-31",budget:500,spent:235,leads:12,conversions:2,cpl:19.58,notes:"Targeting 60+ adults with aging parents in Chicago metro"},
  {id:"MK2",name:"Hospital Discharge Partnerships",channel:"Direct Outreach",status:"active",startDate:"2026-01-15",endDate:"2026-06-30",budget:0,spent:0,leads:8,conversions:3,cpl:0,notes:"Rush, Northwestern, Advocate partnerships"},
  {id:"MK3",name:"Google My Business Optimization",channel:"SEO/Local",status:"active",startDate:"2026-01-01",endDate:"2026-12-31",budget:150,spent:150,leads:6,conversions:1,cpl:25,notes:"Monthly GMB posts, review responses, local SEO"},
  {id:"MK4",name:"Caregiver Recruitment - Indeed",channel:"Indeed/LinkedIn",status:"active",startDate:"2026-02-15",endDate:"2026-04-15",budget:300,spent:180,leads:15,conversions:3,cpl:12,notes:"Sponsored job posts for CNA/HHA positions"},
  {id:"MK5",name:"Referral Bonus Program",channel:"Word of Mouth",status:"active",startDate:"2026-01-01",endDate:"2026-12-31",budget:2000,spent:500,leads:4,conversions:2,cpl:125,notes:"$250 bonus for client referral, $150 for caregiver referral"},
];

// ─── DATE HELPERS ───────────────────────────────────────────────────
const toISO=d=>d.toISOString().split("T")[0];
const fromISO=s=>{const[y,m,d]=s.split("-");return new Date(+y,+m-1,+d);};
const addDays=(d,n)=>{const r=new Date(d);r.setDate(r.getDate()+n);return r;};
const getMonday=d=>{const r=new Date(d);const day=r.getDay();r.setDate(r.getDate()-(day===0?6:day-1));return r;};
const DAYS=["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
const fmtShort=d=>d.toLocaleDateString("en-US",{month:"short",day:"numeric"});
const timeToMin=t=>{const[h,m]=t.split(":").map(Number);return h*60+(m||0);};

// ─── TASK PRESETS ───────────────────────────────────────────────────
const TASK_PRESETS={
  morning:["Morning routine assist","Prepare breakfast","Medication reminder","Light housekeeping","Companionship"],
  afternoon:["Prepare lunch","Medication reminder","Laundry","Errands/shopping","Companionship"],
  fullday:["Morning/afternoon routine","Meals (breakfast, lunch, dinner)","Medication management","Housekeeping","Laundry","Companionship & activities"],
  evening:["Prepare dinner","Evening medication","Bedtime routine","Light cleanup"],
};

// ─── SEED: SCHEDULES ────────────────────────────────────────────────
const MON=toISO(getMonday(now()));
const seedSchedules=[
  {id:"SC1",caregiverId:"CG1",clientId:"CL1",date:toISO(addDays(getMonday(now()),0)),startTime:"08:00",endTime:"14:00",tasks:["Morning routine assist","Prepare lunch","Light housekeeping","Medication reminder","Companionship"],notes:"Tea: Earl Grey with honey at 10am",status:"published",color:"#3c4f3d"},
  {id:"SC2",caregiverId:"CG4",clientId:"CL2",date:toISO(addDays(getMonday(now()),0)),startTime:"11:00",endTime:"19:00",tasks:["Full day care","Meals","Dog care (Buddy)","Laundry","Medicare account setup"],notes:"Walker, fall precautions",status:"published",color:"#3f4749"},
  {id:"SC3",caregiverId:"CG3",clientId:"CL3",date:toISO(addDays(getMonday(now()),0)),startTime:"08:00",endTime:"13:00",tasks:["Morning routine","Breakfast","Medication (Carbidopa-Levodopa timing critical)","Chair exercises","Companionship"],notes:"Adaptive utensils in top drawer",status:"published",color:"#8a7356"},
  {id:"SC4",caregiverId:"CG1",clientId:"CL1",date:toISO(addDays(getMonday(now()),1)),startTime:"08:00",endTime:"14:00",tasks:["Morning routine assist","Prepare lunch","Housekeeping","Medication reminder"],notes:"",status:"published",color:"#3c4f3d"},
  {id:"SC5",caregiverId:"CG3",clientId:"CL3",date:toISO(addDays(getMonday(now()),1)),startTime:"12:00",endTime:"17:00",tasks:["Lunch prep","Medication","CVS medication pickup","Companionship"],notes:"Pick up Carbidopa-Levodopa refill",status:"published",color:"#8a7356"},
  {id:"SC6",caregiverId:"CG4",clientId:"CL2",date:toISO(addDays(getMonday(now()),1)),startTime:"11:00",endTime:"16:00",tasks:["Meals","Grocery shopping","Light cleaning","Dog care"],notes:"Jewel-Osco list on fridge",status:"published",color:"#3f4749"},
  {id:"SC7",caregiverId:"CG2",clientId:"CL2",date:toISO(addDays(getMonday(now()),2)),startTime:"10:00",endTime:"19:00",tasks:["Full day care","Shower assist","Meals","Bedding change","Dog care"],notes:"Emergency contact: Mike Frank",status:"published",color:"#4a3f5c"},
  {id:"SC8",caregiverId:"CG3",clientId:"CL3",date:toISO(addDays(getMonday(now()),2)),startTime:"08:00",endTime:"13:00",tasks:["Morning routine","Breakfast","Medication","Chair exercises"],notes:"",status:"published",color:"#8a7356"},
  {id:"SC9",caregiverId:"CG1",clientId:"CL1",date:toISO(addDays(getMonday(now()),3)),startTime:"08:00",endTime:"14:00",tasks:["Morning routine","Lunch","Housekeeping","Medication","Bridge club transport"],notes:"Bridge at 1pm, community center",status:"published",color:"#3c4f3d"},
  {id:"SC10",caregiverId:"CG4",clientId:"CL2",date:toISO(addDays(getMonday(now()),3)),startTime:"11:00",endTime:"16:30",tasks:["Meals","Business calls assist","Mail sorting","Grocery run"],notes:"",status:"published",color:"#3f4749"},
  {id:"SC11",caregiverId:"CG3",clientId:"CL3",date:toISO(addDays(getMonday(now()),4)),startTime:"08:00",endTime:"13:00",tasks:["Morning routine","Breakfast","Medication","Companionship"],notes:"",status:"published",color:"#8a7356"},
  {id:"SC12",caregiverId:"CG1",clientId:"CL1",date:toISO(addDays(getMonday(now()),4)),startTime:"07:00",endTime:"16:00",tasks:["Full day","Meals","Housekeeping","Eye doctor transport","Medication"],notes:"Eye Dr. Kim at 9:30am, 680 N Lake Shore",status:"published",color:"#3c4f3d"},
  // Next week drafts
  {id:"SC13",caregiverId:"CG1",clientId:"CL1",date:toISO(addDays(getMonday(now()),7)),startTime:"08:00",endTime:"14:00",tasks:["Morning routine","Lunch","Housekeeping","Medication"],notes:"",status:"draft",color:"#3c4f3d"},
  {id:"SC14",caregiverId:"CG3",clientId:"CL3",date:toISO(addDays(getMonday(now()),7)),startTime:"08:00",endTime:"13:00",tasks:["Morning routine","Breakfast","Medication","Exercises"],notes:"",status:"draft",color:"#8a7356"},
  {id:"SC15",caregiverId:"CG4",clientId:"CL2",date:toISO(addDays(getMonday(now()),7)),startTime:"11:00",endTime:"19:00",tasks:["Full day care","Meals","Dog care","Laundry"],notes:"",status:"draft",color:"#3f4749"},
];

// ─── LOGO ───────────────────────────────────────────────────────────
function Logo({s=38,c="#fff"}){return <svg width={s} height={s} viewBox="0 0 100 100" fill="none">
  {/* Chimney */}
  <rect x="18" y="8" width="8" height="32" fill={c}/>
  {/* Roof - thick angled lines */}
  <path d="M8,48 L22,28 L50,8 L92,48" stroke={c} strokeWidth="8" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
  {/* House body */}
  <rect x="22" y="48" width="56" height="42" fill="none" stroke={c} strokeWidth="5"/>
  {/* Door */}
  <rect x="40" y="60" width="20" height="30" fill="none" stroke={c} strokeWidth="4"/>
</svg>;}

// ═══════════════════════════════════════════════════════════════════════
// CSS
// ═══════════════════════════════════════════════════════════════════════
const CSS=`
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;0,900;1,400&family=Inter:wght@300;400;500;600&display=swap');
*{margin:0;padding:0;box-sizing:border-box;-webkit-tap-highlight-color:transparent}
:root{
  --bg:#f5f2eb;--card:#fff;--text:#070707;--t2:#6b6860;--t3:#a8a49c;--bdr:rgba(17,17,17,.1);
  --black:#070707;--white:#ffffff;--green:#020704;--dark:#000201;--slate:#3D3E3F;--ochre:#8a7356;
  --ok:#3c4f3d;--ok-l:rgba(60,79,61,.1);--warn:#8a7356;--warn-l:rgba(138,115,86,.1);--err:#7a3030;--err-l:rgba(122,48,48,.08);
  --blue:#3f4749;--blue-l:rgba(63,71,73,.08);--purple:#4a3f5c;--purple-l:rgba(74,63,92,.08);
  --r:3px;--rs:2px;--sh:none;
  --f:'Inter',system-ui,sans-serif;--fd:'Playfair Display',Georgia,serif;
  --border-thin:1px solid rgba(17,17,17,.1)
}
body{font-family:var(--f);background:var(--bg);color:var(--text);-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;line-height:1.4;font-weight:400}

/* ── LAYOUT ── */
.app{display:flex;min-height:100vh}
.sb{width:220px;background:var(--black);color:var(--white);position:fixed;top:0;left:0;bottom:0;overflow-y:auto;z-index:50;display:flex;flex-direction:column}
.sb-logo{padding:24px 22px;display:flex;align-items:center;gap:12px;border-bottom:1px solid rgba(255,255,255,.06)}
.sb-logo h1{font-family:var(--fd);font-size:17px;letter-spacing:2px;font-weight:400}
.sb-logo p{font-size:0.6rem;letter-spacing:2px;opacity:.3;text-transform:uppercase;font-weight:400}
.sb-sec{padding:22px 22px 8px;font-size:0.6rem;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;opacity:.2}
.ni{display:flex;align-items:center;gap:10px;padding:9px 22px;font-size:12.5px;cursor:pointer;color:rgba(255,255,255,.35);transition:.2s;font-weight:400;border-left:2px solid transparent;letter-spacing:.2px}
.ni:hover{color:rgba(255,255,255,.7);background:rgba(255,255,255,.03)}
.ni.act{color:var(--white);background:rgba(255,255,255,.06);border-left-color:var(--white)}
.ni .ico{width:20px;text-align:center;font-size:13px}
.ni .badge{margin-left:auto;background:rgba(255,255,255,.15);color:var(--white);font-size:9px;font-weight:600;padding:1px 7px;border-radius:2px;min-width:18px;text-align:center}
.main{margin-left:220px;flex:1;padding:28px 36px 60px;min-width:0}

/* ── HEADER ── */
.hdr{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:24px;padding-bottom:20px;border-bottom:var(--border-thin)}
.hdr h2{font-family:var(--fd);font-size:28px;font-weight:400;letter-spacing:-.02em}
.hdr-sub{font-size:11.5px;color:var(--t2);margin-top:4px;letter-spacing:.2px;font-weight:400}

/* ── CARDS ── */
.card{background:var(--card);border:var(--border-thin);margin-bottom:16px;overflow:hidden}
.card-h{display:flex;justify-content:space-between;align-items:center;padding:14px 20px;border-bottom:var(--border-thin)}
.card-h h3{font-size:13px;font-weight:600;letter-spacing:.3px;text-transform:uppercase;font-family:var(--f)}
.card-b{padding:18px 20px}
.card-pad{padding:18px 20px}

/* ── STAT GRID ── */
.sg{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:14px;margin-bottom:22px}
.sc{background:var(--card);padding:20px;border:var(--border-thin);transition:.2s;position:relative;overflow:hidden}
.sc:hover{background:#faf9f6}
.sc .sl{font-size:0.6rem;text-transform:uppercase;letter-spacing:1px;color:var(--t2);font-weight:600}
.sc .sv{font-family:var(--fd);font-size:32px;font-weight:400;margin:6px 0 3px;letter-spacing:-.02em}
.sc .ss{font-size:11px;color:var(--t2);font-weight:400}
.sc.ok::before,.sc.bl::before,.sc.wn::before,.sc.er::before,.sc.pu::before{content:'';position:absolute;left:0;top:0;bottom:0;width:3px}
.sc.ok::before{background:var(--ok)}.sc.bl::before{background:var(--blue)}.sc.wn::before{background:var(--ochre)}.sc.er::before{background:var(--err)}.sc.pu::before{background:var(--purple)}

/* ── TABLE ── */
table{width:100%;border-collapse:collapse;font-size:12px}
th{text-align:left;padding:10px 14px;font-size:0.6rem;text-transform:uppercase;letter-spacing:.8px;color:var(--t2);font-weight:600;border-bottom:var(--border-thin);white-space:nowrap;background:transparent}
td{padding:10px 14px;border-bottom:var(--border-thin);vertical-align:top;font-weight:400}
tr:hover td{background:rgba(0,0,0,.015)}
.tw{overflow-x:auto}

/* ── BUTTONS ── */
.btn{display:inline-flex;align-items:center;gap:6px;padding:8px 18px;border-radius:var(--rs);font-size:11.5px;font-weight:500;font-family:var(--f);border:var(--border-thin);cursor:pointer;transition:.15s;white-space:nowrap;letter-spacing:.3px;background:var(--card);color:var(--text)}
.btn:active{transform:scale(.98)}.btn:disabled{opacity:.35;cursor:default}
.btn-p{background:var(--black);color:var(--white);border-color:var(--black)}
.btn-s{background:transparent;color:var(--text);border-color:rgba(17,17,17,.15)}
.btn-ok{background:var(--ok);color:var(--white);border-color:var(--ok)}
.btn-er{background:var(--err);color:var(--white);border-color:var(--err)}
.btn-bl{background:var(--slate);color:var(--white);border-color:var(--slate)}
.btn-sm{padding:5px 12px;font-size:10.5px}

/* ── TAGS ── */
.tag{display:inline-flex;align-items:center;padding:3px 9px;font-size:0.6rem;font-weight:600;letter-spacing:.5px;text-transform:uppercase;border:1px solid}
.tag-ok{background:var(--ok-l);color:var(--ok);border-color:rgba(60,79,61,.2)}
.tag-wn{background:var(--warn-l);color:var(--ochre);border-color:rgba(138,115,86,.2)}
.tag-er{background:var(--err-l);color:var(--err);border-color:rgba(122,48,48,.15)}
.tag-bl{background:var(--blue-l);color:var(--slate);border-color:rgba(63,71,73,.15)}
.tag-pu{background:var(--purple-l);color:var(--purple);border-color:rgba(74,63,92,.15)}

/* ── FORMS ── */
.fg{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:14px}
.fi label{display:block;font-size:0.6rem;font-weight:600;text-transform:uppercase;letter-spacing:.8px;color:var(--t2);margin-bottom:6px}
.fi input,.fi select,.fi textarea{width:100%;padding:10px 12px;border:var(--border-thin);border-radius:0;font-size:13px;font-family:var(--f);outline:none;background:transparent;font-weight:400}
.fi input:focus,.fi select:focus,.fi textarea:focus{border-color:var(--text)}
.fa{display:flex;gap:8px;padding:14px 20px;border-top:var(--border-thin);justify-content:flex-end}

/* ── TAB ROW ── */
.tab-row{display:flex;gap:0;border-bottom:var(--border-thin);margin-bottom:20px}
.tab-btn{padding:10px 20px;font-size:11px;font-weight:500;cursor:pointer;border:none;background:none;color:var(--t2);border-bottom:2px solid transparent;margin-bottom:-1px;font-family:var(--f);transition:.15s;letter-spacing:.3px;text-transform:uppercase}
.tab-btn:hover{color:var(--text)}
.tab-btn.act{color:var(--text);border-bottom-color:var(--text)}

/* ── AI CARDS ── */
.ai-card{background:var(--black);color:var(--white);padding:22px 24px;margin-bottom:16px;position:relative;overflow:hidden}
.ai-card::after{content:'';position:absolute;top:-40px;right:-40px;width:120px;height:120px;border-radius:50%;background:rgba(255,255,255,.03)}
.ai-card h4{font-family:var(--fd);font-size:14px;font-weight:400;margin-bottom:10px;display:flex;align-items:center;gap:8px;letter-spacing:.3px}
.ai-card p{font-size:12px;opacity:.55;line-height:1.7;font-weight:300}

/* ── AVATAR ── */
.avatar{width:36px;height:36px;border-radius:0;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:600;flex-shrink:0;letter-spacing:.5px}

/* ── CHAT ── */
.chat-bubble{max-width:80%;padding:12px 16px;font-size:12.5px;line-height:1.6;margin-bottom:8px}
.chat-cg{background:var(--black);color:var(--white)}
.chat-fam{background:rgba(61,62,63,.08);color:var(--text)}
.chat-meta{font-size:0.6rem;color:var(--t2);margin-bottom:3px;letter-spacing:.3px;text-transform:uppercase}

/* ── PROGRESS ── */
.progress-bar{height:3px;background:rgba(0,0,0,.06);overflow:hidden}
.progress-fill{height:100%;transition:.3s}

/* ── MODAL ── */
.modal-bg{position:fixed;inset:0;background:rgba(7,7,7,.55);z-index:100;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(2px)}
.modal{background:var(--card);border:var(--border-thin);width:92%;max-width:580px;max-height:85vh;overflow-y:auto}
.modal-h{padding:18px 22px;border-bottom:var(--border-thin);font-family:var(--fd);font-size:17px;font-weight:400;display:flex;justify-content:space-between;align-items:center}
.modal-b{padding:20px 22px}
.modal-f{padding:14px 22px;border-top:var(--border-thin);display:flex;gap:8px;justify-content:flex-end}

/* ── MISC ── */
.empty{text-align:center;padding:36px;color:var(--t3);font-size:12px;letter-spacing:.3px}
.pulse{display:inline-block;width:6px;height:6px;border-radius:50%;animation:pulse 2.5s infinite}
@keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.4;transform:scale(1.5)}}

@media print{.sb,.no-print{display:none!important}.main{margin:0!important;padding:0!important}}

/* ── LOGIN ── */
.login-wrap{min-height:100vh;display:flex;background:var(--bg)}
.login-left{flex:1;background:var(--black);color:var(--white);display:flex;flex-direction:column;justify-content:center;padding:60px}
.login-left h1{font-family:var(--fd);font-size:48px;font-weight:400;letter-spacing:-.02em;margin-bottom:8px}
.login-left .tag-line{font-size:12px;letter-spacing:2px;text-transform:uppercase;opacity:.3;margin-bottom:40px}
.login-left .role-pills{display:flex;flex-wrap:wrap;gap:6px;margin-top:24px}
.login-left .role-pill{padding:4px 12px;font-size:10px;letter-spacing:.5px;text-transform:uppercase;border:1px solid rgba(255,255,255,.15);color:rgba(255,255,255,.4)}
.login-right{width:420px;display:flex;flex-direction:column;justify-content:center;padding:60px}
.login-right h2{font-family:var(--fd);font-size:24px;font-weight:400;margin-bottom:6px}
.login-right .sub{font-size:12px;color:var(--t2);margin-bottom:30px}
.login-field{margin-bottom:16px}
.login-field label{display:block;font-size:0.6rem;font-weight:600;text-transform:uppercase;letter-spacing:.8px;color:var(--t2);margin-bottom:6px}
.login-field input{width:100%;padding:12px 14px;border:var(--border-thin);background:transparent;font-size:14px;font-family:var(--f);outline:none}
.login-field input:focus{border-color:var(--text)}
.login-btn{width:100%;padding:14px;background:var(--black);color:var(--white);border:none;font-size:12px;font-weight:600;letter-spacing:1px;text-transform:uppercase;cursor:pointer;font-family:var(--f);margin-top:8px;transition:.15s}
.login-btn:hover{opacity:.85}
.login-btn:active{transform:scale(.99)}
.login-err{color:var(--err);font-size:12px;margin-top:10px}
.login-hints{margin-top:30px;padding-top:20px;border-top:var(--border-thin)}
.login-hints .hint{display:flex;justify-content:space-between;padding:4px 0;font-size:11px;color:var(--t2)}
.login-hints .hint span:first-child{font-weight:600;color:var(--text)}
.user-bar{display:flex;align-items:center;gap:10px;padding:14px 22px;border-top:1px solid rgba(255,255,255,.06);cursor:pointer}
.user-bar:hover{background:rgba(255,255,255,.03)}
.user-bar .ub-name{font-size:12px;font-weight:500}
.user-bar .ub-role{font-size:9px;text-transform:uppercase;letter-spacing:1px;opacity:.35}

/* ── CAREGIVER PORTAL ── */
.cg-header{background:var(--black);color:var(--white);padding:24px 30px;margin:-28px -36px 24px;display:flex;justify-content:space-between;align-items:center}
.cg-header h2{font-family:var(--fd);font-size:24px;font-weight:400}
.cg-header .cg-meta{text-align:right;font-size:11px;opacity:.5}
.cg-stat-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:10px;margin-bottom:20px}
.cg-stat{background:var(--card);border:var(--border-thin);padding:16px;text-align:center}
.cg-stat .val{font-family:var(--fd);font-size:24px;font-weight:400;margin:4px 0}
.cg-stat .lbl{font-size:0.55rem;text-transform:uppercase;letter-spacing:1px;color:var(--t2)}

/* ── TIME CLOCK ── */
.clock-panel{background:var(--black);color:var(--white);padding:28px;margin-bottom:16px;position:relative;overflow:hidden}
.clock-panel::after{content:'';position:absolute;top:-50px;right:-50px;width:150px;height:150px;border-radius:50%;background:rgba(255,255,255,.02)}
.clock-panel .timer{font-family:var(--fd);font-size:48px;font-weight:400;letter-spacing:2px;margin:10px 0}
.clock-panel .shift-meta{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-top:16px}
.clock-panel .sm-box{background:rgba(255,255,255,.06);padding:10px}
.clock-panel .sm-label{font-size:0.5rem;text-transform:uppercase;letter-spacing:1px;opacity:.4}
.clock-panel .sm-val{font-size:14px;font-weight:500;margin-top:3px}
.clock-btn-row{display:flex;gap:8px;margin-top:18px}
.clock-btn{flex:1;padding:14px;border:none;font-size:12px;font-weight:600;letter-spacing:1px;text-transform:uppercase;cursor:pointer;font-family:var(--f);transition:.15s}
.clock-btn:active{transform:scale(.98)}
.clock-btn-in{background:var(--white);color:var(--black)}
.clock-btn-out{background:#7a3030;color:var(--white)}
.clock-btn-break{background:rgba(255,255,255,.1);color:var(--white);border:1px solid rgba(255,255,255,.15)}
.gps-indicator{display:flex;align-items:center;gap:6px;font-size:11px;opacity:.5;margin-top:12px}
.gps-dot{width:6px;height:6px;border-radius:50%;background:#3c4f3d;animation:pulse 2.5s infinite}
.gps-trail{display:flex;gap:2px;flex-wrap:wrap;margin-top:10px}
.gps-trail .dot{width:4px;height:4px;border-radius:50%;background:rgba(60,79,61,.5)}
.geofence-badge{display:inline-flex;align-items:center;gap:5px;padding:4px 10px;font-size:10px;font-weight:600;letter-spacing:.5px;text-transform:uppercase;margin-top:8px}
.geofence-in{background:rgba(60,79,61,.15);color:#3c4f3d}
.geofence-out{background:rgba(138,115,86,.15);color:#8a7356}
.shift-history-item{display:flex;justify-content:space-between;align-items:center;padding:12px 20px;border-bottom:var(--border-thin)}
.exp-submit-form{padding:18px 20px;border-bottom:var(--border-thin);background:rgba(0,0,0,.01)}

/* ── RUNNING LATE ── */
.late-banner{background:linear-gradient(135deg,#3d2600,#1a1000);color:var(--white);padding:16px 20px;margin-bottom:14px;display:flex;align-items:center;gap:14px;position:relative;overflow:hidden}
.late-banner::after{content:'';position:absolute;top:-20px;right:-20px;width:80px;height:80px;border-radius:50%;background:rgba(255,255,255,.04)}
.late-banner .late-icon{width:42px;height:42px;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,.1);flex-shrink:0;font-size:20px}
.late-banner .late-info{flex:1}
.late-banner .late-title{font-size:12px;font-weight:600;letter-spacing:.5px;text-transform:uppercase}
.late-banner .late-eta{font-family:var(--fd);font-size:22px;font-weight:400;margin:2px 0}
.late-banner .late-detail{font-size:11px;opacity:.5}
.late-form{background:var(--card);border:var(--border-thin);margin-bottom:14px;overflow:hidden}
.late-form-header{padding:14px 20px;background:rgba(138,115,86,.08);border-bottom:var(--border-thin);display:flex;align-items:center;gap:8px}
.late-form-header span{font-size:13px;font-weight:600}
.late-form-body{padding:16px 20px}
.eta-display{background:var(--black);color:var(--white);padding:18px;text-align:center;margin-bottom:14px}
.eta-display .eta-time{font-family:var(--fd);font-size:36px;font-weight:400;margin:4px 0}
.eta-display .eta-label{font-size:9px;text-transform:uppercase;letter-spacing:1.5px;opacity:.4}
.eta-display .eta-dist{font-size:12px;opacity:.5;margin-top:4px}
.eta-reasons{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:14px}
.eta-reason{padding:10px 8px;border:var(--border-thin);text-align:center;font-size:11px;font-weight:600;cursor:pointer;transition:.15s}
.eta-reason.sel{background:var(--black);color:var(--white);border-color:var(--black)}
.late-notif{display:flex;align-items:center;gap:8px;padding:8px 12px;background:rgba(138,115,86,.1);font-size:11px;color:#8a7356;font-weight:600;margin-top:10px}

/* ── SCHEDULER ── */
.week-nav{display:flex;align-items:center;justify-content:space-between;margin-bottom:14px}
.week-nav .wn-center{text-align:center;cursor:pointer}
.week-nav .wn-label{font-size:14px;font-weight:600}
.week-nav .wn-sub{font-size:11px;color:var(--t2);margin-top:1px}
.week-nav button{width:36px;height:36px;border:var(--border-thin);background:var(--card);display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:14px;font-family:var(--f)}
.day-cols{display:grid;grid-template-columns:repeat(7,1fr);gap:3px;margin-bottom:14px}
.day-col{text-align:center;padding:8px 4px;cursor:pointer;border:var(--border-thin);background:var(--card);transition:.15s}
.day-col:hover{background:rgba(0,0,0,.02)}
.day-col .dc-day{font-size:0.55rem;font-weight:600;color:var(--t2);text-transform:uppercase;letter-spacing:.5px}
.day-col .dc-num{font-size:16px;font-weight:600;margin-top:3px}
.day-col .dc-dots{display:flex;gap:2px;justify-content:center;margin-top:5px;min-height:6px}
.day-col .dc-dot{width:5px;height:5px;border-radius:50%}
.day-col.sel{background:var(--black);color:var(--white);border-color:var(--black)}
.day-col.sel .dc-day{color:rgba(255,255,255,.5)}
.day-col.sel .dc-dot{opacity:.7}
.day-col.is-today:not(.sel){border-color:var(--black);border-width:2px}
.shift-block{border:var(--border-thin);margin-bottom:8px;padding:12px 16px;position:relative;cursor:pointer;background:var(--card);transition:.1s}
.shift-block:hover{background:rgba(0,0,0,.015)}
.shift-block::before{content:'';position:absolute;left:0;top:0;bottom:0;width:4px}
.publish-bar{background:var(--black);color:var(--white);padding:12px 18px;margin-bottom:14px;display:flex;align-items:center;justify-content:space-between}
.publish-bar .pb-text{font-size:12px;font-weight:600}
.publish-bar .pb-sub{font-size:10px;opacity:.4;margin-top:1px}
.conflict-warn{background:rgba(122,48,48,.08);border:1px solid rgba(122,48,48,.15);padding:10px 14px;margin-bottom:10px;display:flex;align-items:center;gap:8px;font-size:12px;color:var(--err);font-weight:600}

/* ═══════════════════════════════════════════════════════════════
   MOBILE RESPONSIVE
   ═══════════════════════════════════════════════════════════════ */
@media(max-width:1024px){
  .sb{width:200px}.main{margin-left:200px;padding:20px 22px 50px}
  .sg{grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:10px}
  .fg{grid-template-columns:1fr 1fr}.hdr h2{font-size:22px}
}
@media(max-width:768px){
  /* Force inline grid layouts to stack on mobile */
  [style*="grid-template-columns: 1fr 3"],[style*="grid-template-columns: 1fr 1fr"]{grid-template-columns:1fr!important}
  [style*="grid-template-columns: repeat(4"],[style*="grid-template-columns: repeat(5"],[style*="grid-template-columns: repeat(6"]{grid-template-columns:repeat(2,1fr)!important}
  .sb{position:fixed;bottom:0;top:auto;left:0;right:0;width:100%;height:auto;flex-direction:row;overflow-x:auto;overflow-y:hidden;z-index:100;padding:0;border-top:1px solid rgba(255,255,255,.1)}
  .sb-logo,.sb-sec,.user-bar{display:none}
  .sb nav{display:flex;flex-direction:row;overflow-x:auto;-webkit-overflow-scrolling:touch;gap:0;padding:0;flex:1}
  .sb nav::-webkit-scrollbar{display:none}
  .ni{flex-direction:column;padding:8px 12px;gap:3px;border-left:none;border-top:2px solid transparent;font-size:9px;white-space:nowrap;min-width:62px;justify-content:center;align-items:center;text-align:center}
  .ni.act{border-left:none;border-top-color:var(--white)}
  .ni .ico{font-size:16px;width:auto}
  .ni .badge{position:absolute;top:2px;right:2px;margin:0;font-size:7px;padding:0 4px;min-width:14px}
  .ni span:not(.ico):not(.badge){font-size:8px;max-width:54px;overflow:hidden;text-overflow:ellipsis}
  .main{margin-left:0;padding:16px 16px 90px}
  .hdr{flex-direction:column;gap:10px;padding-bottom:14px}
  .hdr h2{font-size:20px}
  .hdr>div:last-child{display:flex;gap:6px;flex-wrap:wrap}
  .sg{grid-template-columns:1fr 1fr;gap:8px;margin-bottom:14px}
  .sc{padding:14px}.sc .sv{font-size:24px}
  .fg{grid-template-columns:1fr;gap:10px}
  .card-h{padding:12px 14px}.card-h h3{font-size:11px}
  .card-b,.card-pad{padding:14px}
  .tw{-webkit-overflow-scrolling:touch}table{min-width:600px}
  th,td{padding:8px 10px;font-size:11px}
  .btn{padding:10px 16px;font-size:12px;min-height:40px}
  .btn-sm{padding:8px 12px;font-size:11px;min-height:34px}
  .tag{padding:3px 7px;font-size:0.55rem}
  .tab-row{overflow-x:auto;-webkit-overflow-scrolling:touch;flex-wrap:nowrap;padding-bottom:2px}
  .tab-row::-webkit-scrollbar{display:none}
  .tab-btn{padding:10px 14px;font-size:10px;white-space:nowrap;flex-shrink:0}
  .ai-card{padding:16px 18px}.ai-card h4{font-size:13px}.ai-card p{font-size:11px}
  .modal-bg{align-items:flex-end}
  .modal{width:100%;max-width:100%;max-height:92vh;border:none}
  .modal-h{padding:14px 16px;font-size:15px}
  .modal-b{padding:14px 16px}.modal-f{padding:10px 16px}
  .login-wrap{flex-direction:column}
  .login-left{padding:40px 24px 30px;min-height:auto}
  .login-left h1{font-size:36px}
  .login-right{width:100%;padding:30px 24px 40px}
  .login-right h2{font-size:20px}
  .login-hints .hint{flex-direction:column;gap:2px;padding:6px 0}
  .login-field input{padding:14px;font-size:16px}
  .login-btn{padding:16px;font-size:13px}
  .cg-header{margin:-16px -16px 16px;padding:20px 16px}
  .cg-header h2{font-size:20px}.cg-header .cg-meta{font-size:10px}
  .cg-stat-grid{grid-template-columns:1fr 1fr 1fr;gap:6px}
  .cg-stat{padding:12px 8px}.cg-stat .val{font-size:20px}.cg-stat .lbl{font-size:0.5rem}
  .clock-panel{padding:20px 16px;margin-left:-16px;margin-right:-16px;width:calc(100% + 32px)}
  .clock-panel .timer{font-size:36px}
  .clock-panel .shift-meta{grid-template-columns:1fr 1fr;gap:6px}
  .clock-btn-row{flex-direction:column;gap:6px}
  .clock-btn{padding:16px}
  .shift-history-item{flex-direction:column;gap:6px;align-items:flex-start;padding:10px 14px}
  .chat-bubble{max-width:90%;font-size:12px;padding:10px 12px}
  .progress-bar{height:4px}
  .avatar{width:32px;height:32px;font-size:10px}
  .exp-submit-form{padding:14px}
  .geofence-badge{font-size:9px;padding:3px 8px}
  .gps-trail .dot{width:3px;height:3px}
  .gps-indicator{font-size:10px}
  .late-banner{padding:12px 14px;gap:10px}
  .late-banner .late-icon{width:36px;height:36px;font-size:16px}
  .late-banner .late-eta{font-size:18px}
  .late-banner .late-detail{font-size:9px}
  .late-form-body{padding:14px}
  .eta-display{padding:14px}
  .eta-display .eta-time{font-size:28px}
  .eta-reasons{grid-template-columns:1fr 1fr}
  .eta-reason{padding:8px 6px;font-size:10px}
  .late-notif{font-size:10px;padding:6px 10px}
  .day-cols{grid-template-columns:repeat(7,1fr);gap:2px}
  .day-col{padding:6px 2px}
  .day-col .dc-day{font-size:0.45rem}
  .day-col .dc-num{font-size:13px}
  .day-col .dc-dot{width:4px;height:4px}
  .shift-block{padding:10px 12px;margin-bottom:6px}
  .publish-bar{padding:10px 14px;flex-direction:column;gap:8px;text-align:center}
  .week-nav button{width:32px;height:32px;font-size:12px}
}
@media(max-width:400px){
  .main{padding:12px 12px 90px}
  .sg{grid-template-columns:1fr 1fr;gap:6px}
  .sc{padding:10px}.sc .sv{font-size:20px}.sc .sl{font-size:0.5rem}
  .hdr h2{font-size:18px}
  .cg-header{padding:16px 12px}.cg-header h2{font-size:18px}
  .cg-stat-grid{grid-template-columns:1fr 1fr;gap:5px}
  .clock-panel .timer{font-size:30px}
  .login-left{padding:30px 20px 20px}.login-left h1{font-size:28px}
  .login-right{padding:24px 20px 30px}
  .tab-btn{padding:8px 10px;font-size:9px}
  .ni{padding:6px 8px;min-width:54px}.ni .ico{font-size:14px}
}
@media(hover:none){
  .btn{min-height:44px}.btn-sm{min-height:38px}
  .ni{min-height:52px}
  .fi input,.fi select,.fi textarea{min-height:44px;font-size:16px}
  .tab-btn{min-height:40px}
  .login-field input{min-height:48px}
}
`;

// ═══════════════════════════════════════════════════════════════════════
// LOGIN SCREEN
// ═══════════════════════════════════════════════════════════════════════
function LoginScreen({onLogin}){
  const [email,setEmail]=useState("");
  const [pin,setPin]=useState("");
  const [err,setErr]=useState("");
  const submit=()=>{
    const u=USERS.find(u=>u.email===email&&u.pin===pin&&u.active);
    if(u)onLogin(u); else setErr("Invalid credentials");
  };
  return <div className="login-wrap">
    <div className="login-left">
      <Logo s={72} c="#fff"/>
      <div style={{height:24}}/>
      <h1>CWIN</h1>
      <div className="tag-line">{CO.tag}</div>
      <div style={{fontSize:13,opacity:.45,lineHeight:1.7,maxWidth:380}}>Enterprise care platform for home care operations, compliance, billing, training, and family engagement.</div>
      <div className="role-pills">
        {Object.values(ROLES).map(r=> <div key={r.label} className="role-pill">{r.label}</div>)}
      </div>
    </div>
    <div className="login-right">
      <h2>Sign In</h2>
      <div className="sub">Enter your credentials to access your portal</div>
      <div className="login-field"><label>Email</label><input type="email" placeholder="you@cwinathome.com" value={email} onChange={e=>{setEmail(e.target.value);setErr("");}}/></div>
      <div className="login-field"><label>PIN</label><input type="password" placeholder="••••" maxLength={4} value={pin} onChange={e=>{setPin(e.target.value);setErr("");}} onKeyDown={e=>e.key==="Enter"&&submit()}/></div>
      <button className="login-btn" onClick={submit}>Sign In</button>
      {err&& <div className="login-err">{err}</div>}
      <div className="login-hints">
        <div style={{fontSize:10,textTransform:"uppercase",letterSpacing:1,color:"var(--t2)",fontWeight:600,marginBottom:8}}>Demo Accounts</div>
        {[{e:"kip@cwinathome.com",p:"1234",r:"Owner"},{e:"admin@cwinathome.com",p:"4321",r:"Admin"},{e:"erolyn@cwinathome.com",p:"1111",r:"Caregiver"},{e:"becky.sutton@email.com",p:"5555",r:"Client"},{e:"tom.sutton@email.com",p:"8888",r:"Family"}].map(h=> <div key={h.e} className="hint" style={{cursor:"pointer"}} onClick={()=>{setEmail(h.e);setPin(h.p);}}>
          <span>{h.r}</span><span>{h.e} / {h.p}</span>
        </div>)}
      </div>
    </div>
  </div>;
}

// ═══════════════════════════════════════════════════════════════════════
// CAREGIVER HOME PORTAL
// ═══════════════════════════════════════════════════════════════════════
// ─── CAREGIVER SCHEDULE VIEW (read-only) ────────────────────────────
function CGScheduleView({user,schedules,clients}){
  const [weekStart,setWS]=useState(getMonday(now()));
  const [selDay,setSD]=useState(toISO(now()));
  const weekDates=Array.from({length:7},(_,i)=>addDays(weekStart,i));
  const mySched=schedules.filter(s=>s.caregiverId===user.caregiverId&&s.status==="published");
  const weekSched=mySched.filter(s=>s.date>=toISO(weekStart)&&s.date<=toISO(addDays(weekStart,6)));
  const daySched=mySched.filter(s=>s.date===selDay).sort((a,b)=>a.startTime.localeCompare(b.startTime));
  const weekHrs=weekSched.reduce((s,sh)=>s+(timeToMin(sh.endTime)-timeToMin(sh.startTime))/60,0);

  return <div>
    <div className="cg-stat-grid" style={{gridTemplateColumns:"repeat(3,1fr)",marginBottom:14}}>
      <div className="cg-stat"><div className="lbl">This Week</div><div className="val">{weekSched.length}</div><div className="lbl">shifts</div></div>
      <div className="cg-stat"><div className="lbl">Hours</div><div className="val">{weekHrs.toFixed(0)}</div><div className="lbl">scheduled</div></div>
      <div className="cg-stat"><div className="lbl">Clients</div><div className="val">{new Set(weekSched.map(s=>s.clientId)).size}</div><div className="lbl">this week</div></div>
    </div>
    <div className="week-nav">
      <button onClick={()=>setWS(addDays(weekStart,-7))}>←</button>
      <div className="wn-center" onClick={()=>{setWS(getMonday(now()));setSD(toISO(now()));}}><div className="wn-label">{fmtShort(weekStart)} — {fmtShort(addDays(weekStart,6))}</div><div className="wn-sub">Tap for today</div></div>
      <button onClick={()=>setWS(addDays(weekStart,7))}>→</button>
    </div>
    <div className="day-cols">
      {weekDates.map((d,i)=>{const iso=toISO(d);const ct=mySched.filter(s=>s.date===iso).length;
        return <div key={i} className={`day-col ${iso===selDay?"sel":""} ${iso===toISO(now())?"is-today":""}`} onClick={()=>setSD(iso)}>
          <div className="dc-day">{DAYS[i]}</div><div className="dc-num">{d.getDate()}</div>
          <div className="dc-dots">{Array.from({length:Math.min(ct,4)}).map((_,j)=> <div key={j} className="dc-dot" style={{background:iso===selDay?"rgba(255,255,255,.6)":"#3c4f3d"}}/>)}</div>
        </div>;
      })}
    </div>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
      <div style={{fontWeight:600,fontSize:13}}>{fromISO(selDay).toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric"})}{selDay===toISO(now())&&<span style={{color:"#3c4f3d",marginLeft:6,fontSize:11}}>TODAY</span>}</div>
      <div style={{fontSize:12,color:"var(--t2)"}}>{daySched.length} shift{daySched.length!==1?"s":""}</div>
    </div>
    {daySched.length===0&& <div className="card card-b empty">No shifts on {fromISO(selDay).toLocaleDateString("en-US",{weekday:"long"})}</div>}
    {daySched.map(s=>{const cl=clients.find(c=>c.id===s.clientId);const hrs=((timeToMin(s.endTime)-timeToMin(s.startTime))/60).toFixed(1);
      return <div key={s.id} className="shift-block" style={{cursor:"default"}}>
        <div style={{position:"absolute",left:0,top:0,bottom:0,width:4,background:s.color||"#3c4f3d"}}/>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
          <div style={{paddingLeft:10}}>
            <div style={{fontSize:14,fontWeight:600}}>{s.startTime} — {s.endTime} <span style={{fontWeight:400,color:"var(--t2)",fontSize:12}}>({hrs}h)</span></div>
            <div style={{fontFamily:"var(--fd)",fontSize:16,fontWeight:400,marginTop:2}}>{cl?.name}</div>
            <div style={{fontSize:11,color:"var(--t2)",marginTop:3}}>📍 {cl?.addr}</div>
            {s.notes&& <div style={{fontSize:11,color:"#8a7356",marginTop:4,fontWeight:600}}>📝 {s.notes}</div>}
          </div>
          <span className="tag tag-ok">{s.tasks.length} tasks</span>
        </div>
        {s.tasks.length>0&& <div style={{marginTop:10,paddingLeft:10,display:"flex",gap:4,flexWrap:"wrap"}}>
          {s.tasks.map((t,i)=> <span key={i} style={{fontSize:10,padding:"2px 8px",background:"var(--bg)",border:"var(--border-thin)",color:"var(--t2)"}}>{t}</span>)}
        </div>}
      </div>;
    })}
  </div>;
}

function CaregiverPortal({user,clients,caregivers,careNotes,setCareNotes,incidents,setIncidents,expenses,setExpenses,events,chores,schedules,trainingProgress,setTrainingProgress,familyMsgs,setFamilyMsgs,modal,setModal}){
  const [tab,setTab]=useState("home");
  const [shift,setShift]=useState(null);
  const [shiftHistory,setShiftHistory]=useState([]);
  const [gpsTrail,setGpsTrail]=useState([]);
  const [clockTime,setClockTime]=useState(now());
  const [travel,setTravel]=useState({miles:0,segments:[]});
  const [showExpForm,setShowExpForm]=useState(false);
  const [expForm,setExpForm]=useState({clientId:"",category:"Mileage",description:"",amount:0,quantity:0,receipt:false});
  const [lateAlert,setLateAlert]=useState(null); // {clientId, clientName, reason, eta, gps, sentAt, distance}
  const [showLateForm,setShowLateForm]=useState(null); // clientId or null
  const [lateReason,setLateReason]=useState("Traffic");
  const [lateMinutes,setLateMinutes]=useState(15);
  const [lateHistory,setLateHistory]=useState([]);
  const gpsRef=useRef(null);
  const cg=caregivers.find(c=>c.id===user.caregiverId);

  const myClients=clients.filter(cl=>{
    const hasNotes=careNotes.some(n=>n.caregiverId===user.caregiverId&&n.clientId===cl.id);
    const hasChores=chores.some(ch=>ch.assignedTo===user.caregiverId&&ch.clientId===cl.id);
    return hasNotes||hasChores;
  });
  if(myClients.length===0) clients.forEach(c=>myClients.push(c));

  const myNotes=careNotes.filter(n=>n.caregiverId===user.caregiverId).sort((a,b)=>new Date(b.date)-new Date(a.date));
  const myExpenses=expenses.filter(e=>e.caregiverId===user.caregiverId);
  const myChores=chores.filter(ch=>ch.assignedTo===user.caregiverId);
  const myTraining=(trainingProgress[user.caregiverId]||[]);
  const pct=Math.round(myTraining.length/TRAINING_MODULES.length*100);

  // Clock tick
  useEffect(()=>{const t=setInterval(()=>setClockTime(now()),1000);return()=>clearInterval(t);},[]);

  // GPS tracking during shift
  useEffect(()=>{
    if(shift){
      gpsRef.current=setInterval(()=>{
        const loc=GPS_LOCATIONS[shift.clientId];
        if(loc){const pos=simGPS(loc);setGpsTrail(p=>[...p,pos]);}
      },4000);
      return()=>clearInterval(gpsRef.current);
    } else { if(gpsRef.current)clearInterval(gpsRef.current); }
  },[shift]);

  const clockIn=(clientId)=>{
    const loc=GPS_LOCATIONS[clientId];
    if(!loc)return;
    const gps=simGPS(loc);
    const addr=gpsAddr(gps.lat,gps.lng);
    const inFence=Math.abs(gps.lat-loc.lat)+Math.abs(gps.lng-loc.lng)<0.005;
    setShift({id:"SH"+uid(),clientId,clientName:loc.name,clockInTime:now(),clockInGPS:gps,clockInAddr:addr,inFence,breaks:[],onBreak:false});
    setGpsTrail([gps]);
  };

  const clockOut=()=>{
    if(!shift)return;
    const loc=GPS_LOCATIONS[shift.clientId];
    const gps=loc?simGPS(loc):{lat:0,lng:0};
    const dur=Math.round((now()-shift.clockInTime)/60000);
    const breakMins=shift.breaks.reduce((s,b)=>s+(b.end?(b.end-b.start)/60000:0),0);
    const completed={...shift,clockOutTime:now(),clockOutGPS:gps,clockOutAddr:gpsAddr(gps.lat,gps.lng),duration:dur,workMins:dur-Math.round(breakMins),breakMins:Math.round(breakMins),gpsPoints:gpsTrail.length};
    setShiftHistory(p=>[completed,...p]);
    if(shiftHistory.length>0){
      const last=shiftHistory[0];
      const d=gpsDist(last.clockOutGPS||last.clockInGPS,shift.clockInGPS);
      if(d>0.5) setTravel(p=>({miles:p.miles+d,segments:[...p.segments,{from:last.clientName,to:shift.clientName,miles:d}]}));
    }
    setShift(null);setGpsTrail([]);
  };

  const toggleBreak=()=>{
    if(!shift)return;
    if(shift.onBreak) setShift(s=>({...s,onBreak:false,breaks:s.breaks.map((b,i)=>i===s.breaks.length-1?{...b,end:now()}:b)}));
    else setShift(s=>({...s,onBreak:true,breaks:[...s.breaks,{start:now(),end:null}]}));
  };

  const shiftDur=shift?Math.round((clockTime-shift.clockInTime)/60000):0;
  const breakMin=shift?shift.breaks.reduce((s,b)=>s+(b.end?(b.end-b.start)/60000:(clockTime-b.start)/60000),0):0;
  const workMin=shiftDur-Math.round(breakMin);

  const submitExpense=()=>{
    if(!expForm.description||(!expForm.amount&&!expForm.quantity))return;
    const total=expForm.category==="Mileage"?expForm.quantity*MILEAGE_RATE:expForm.amount;
    const loc=GPS_LOCATIONS[expForm.clientId];
    const gps=loc?simGPS(loc):null;
    setExpenses(p=>[{id:"EX"+uid(),caregiverId:user.caregiverId,clientId:expForm.clientId,date:today(),category:expForm.category,description:expForm.description,amount:total,receipt:expForm.receipt,status:"pending",gps:gps?gpsAddr(gps.lat,gps.lng):""},...p]);
    setExpForm({clientId:expForm.clientId,category:"Mileage",description:"",amount:0,quantity:0,receipt:false});
    setShowExpForm(false);
  };

  // ── RUNNING LATE WITH GPS ETA ──
  const calcETA=(clientId)=>{
    const dest=GPS_LOCATIONS[clientId];
    if(!dest)return{dist:0,eta:15,addr:""};
    // Simulate current position (e.g. caregiver's home area)
    const currentGPS={lat:dest.lat+(Math.random()-.5)*.06,lng:dest.lng+(Math.random()-.5)*.06};
    const miles=gpsDist(currentGPS,dest);
    const driveMin=Math.max(5,Math.round(miles/0.4)); // ~24mph city avg
    return{dist:miles,eta:driveMin,currentGPS,destGPS:dest,addr:gpsAddr(currentGPS.lat,currentGPS.lng),destAddr:dest.addr};
  };

  const sendLateAlert=(clientId)=>{
    const cl=clients.find(c=>c.id===clientId);
    const calc=calcETA(clientId);
    const etaMins=lateMinutes||calc.eta;
    const arrivalTime=new Date(now().getTime()+etaMins*60000);
    const alert={id:"LA"+uid(),clientId,clientName:cl?.name||"",reason:lateReason,etaMinutes:etaMins,arrivalTime,gps:calc.currentGPS,currentAddr:calc.addr,destAddr:calc.destAddr,distance:calc.dist,sentAt:now(),caregiver:user.name,caregiverId:user.caregiverId};
    setLateAlert(alert);
    setLateHistory(p=>[alert,...p]);
    setShowLateForm(null);
    // In production this would push to the care team, family portal, and client
  };

  const dismissLate=()=>setLateAlert(null);

  const tabs=[
    {key:"home",label:"Home"},{key:"timeclock",label:"Time Clock"},{key:"schedule",label:"Schedule"},{key:"clients",label:"My Clients"},{key:"notes",label:"Care Notes"},
    {key:"expenses",label:"Expenses"},{key:"training",label:"Training"},{key:"messages",label:"Messages"},
  ];

  return <div>
    <div className="cg-header">
      <div><div style={{fontSize:11,textTransform:"uppercase",letterSpacing:1.5,opacity:.3,marginBottom:4}}>Caregiver Portal</div><h2>Welcome, {user.name.split(" ")[0]}</h2></div>
      <div className="cg-meta">
        <div>{cg?.certs?.join(" | ")}</div>
        <div style={{marginTop:2}}>{clockTime.toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric"})}</div>
        {shift&& <div style={{marginTop:4,color:"#3c4f3d",fontWeight:600}}>● ON SHIFT</div>}
      </div>
    </div>
    <div className="tab-row">{tabs.map(t=> <button key={t.key} className={`tab-btn ${tab===t.key?"act":""}`} onClick={()=>setTab(t.key)}>{t.label}{t.key==="timeclock"&&shift?" ●":""}</button>)}</div>

    {/* ═══ HOME ═══ */}
    {tab==="home"&& <div>
      {/* Running Late Banner */}
      {lateAlert&& <div className="late-banner" style={{cursor:"pointer"}} onClick={()=>setTab("timeclock")}>
        <div className="late-icon">⏰</div>
        <div className="late-info">
          <div className="late-title">Running Late — {lateAlert.clientName}</div>
          <div className="late-eta">ETA {lateAlert.etaMinutes} min</div>
          <div className="late-detail">{lateAlert.reason} | {lateAlert.distance.toFixed(1)} mi away | Tap to manage</div>
        </div>
      </div>}

      {/* Active Shift Banner */}
      {shift&& <div className="clock-panel" style={{marginBottom:16,cursor:"pointer"}} onClick={()=>setTab("timeclock")}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
          <div><div style={{fontSize:10,textTransform:"uppercase",letterSpacing:1.5,opacity:.4}}>Active Shift</div><div style={{fontSize:16,fontWeight:500,marginTop:4}}>{shift.clientName}</div></div>
          <div style={{textAlign:"right"}}><div className="timer" style={{fontSize:32}}>{String(Math.floor(workMin/60)).padStart(2,"0")}:{String(workMin%60).padStart(2,"0")}</div><div style={{fontSize:10,opacity:.4}}>TAP TO MANAGE</div></div>
        </div>
        <div className="gps-indicator"><div className="gps-dot"/>GPS tracking | {gpsTrail.length} points</div>
      </div>}

      <div className="cg-stat-grid">
        <div className="cg-stat"><div className="lbl">My Clients</div><div className="val">{myClients.length}</div></div>
        <div className="cg-stat"><div className="lbl">Care Notes</div><div className="val">{myNotes.length}</div></div>
        <div className="cg-stat"><div className="lbl">Open Tasks</div><div className="val">{myChores.length}</div></div>
        <div className="cg-stat"><div className="lbl">Training</div><div className="val">{pct}%</div></div>
        <div className="cg-stat"><div className="lbl">Expenses</div><div className="val">${myExpenses.reduce((s,e)=>s+e.amount,0).toFixed(0)}</div></div>
        <div className="cg-stat"><div className="lbl">Travel Today</div><div className="val">{travel.miles.toFixed(1)} mi</div></div>
      </div>

      <div className="ai-card"><h4><span className="pulse" style={{background:"var(--ok)"}}/>Today's Summary</h4>
        <p>{myChores.length} tasks across {myClients.length} client{myClients.length!==1?"s":""}. Training {pct}%. {myExpenses.filter(e=>e.status==="pending").length} expense{myExpenses.filter(e=>e.status==="pending").length!==1?"s":""} pending. {shiftHistory.length} shift{shiftHistory.length!==1?"s":""} completed today ({shiftHistory.reduce((s,sh)=>s+sh.workMins,0)} min worked). {travel.miles>0?`${travel.miles.toFixed(1)} miles traveled ($${(travel.miles*MILEAGE_RATE).toFixed(2)} reimbursable).`:""}</p>
      </div>

      <div className="card"><div className="card-h"><h3>Recent Notes</h3></div>
        {myNotes.slice(0,5).map(n=>{const cl=clients.find(c=>c.id===n.clientId);return <div key={n.id} style={{padding:"10px 20px",borderBottom:"var(--border-thin)"}}>
          <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:"var(--t2)",marginBottom:4}}><span style={{fontWeight:600}}>{cl?.name}</span><span>{fmtRel(n.date)}</span></div>
          <div style={{fontSize:12.5,lineHeight:1.6}}>{n.text.slice(0,150)}{n.text.length>150?"...":""}</div>
        </div>;})}
      </div>
    </div>}

    {/* ═══ TIME CLOCK ═══ */}
    {tab==="timeclock"&& <div>

      {/* Running Late Active Banner */}
      {lateAlert&& <div className="late-banner">
        <div className="late-icon">⏰</div>
        <div className="late-info">
          <div className="late-title">Running Late — {lateAlert.clientName}</div>
          <div className="late-eta">ETA {lateAlert.etaMinutes} min</div>
          <div className="late-detail">{lateAlert.reason} | {lateAlert.distance.toFixed(1)} mi away | Sent {fmtT(lateAlert.sentAt)}</div>
          <div className="late-detail">📍 Current: {lateAlert.currentAddr}</div>
          <div className="late-detail">🏠 Destination: {lateAlert.destAddr}</div>
        </div>
        <button className="btn btn-sm" style={{background:"rgba(255,255,255,.15)",color:"#fff",border:"none"}} onClick={dismissLate}>✕</button>
      </div>}

      {/* Running Late Form */}
      {showLateForm&& <div className="late-form">
        <div className="late-form-header"><span>⏰ Running Late — {clients.find(c=>c.id===showLateForm)?.name}</span></div>
        <div className="late-form-body">
          {(()=>{const calc=calcETA(showLateForm);return <div className="eta-display">
            <div className="eta-label">GPS-Based ETA</div>
            <div className="eta-time">{calc.eta} min</div>
            <div className="eta-dist">{calc.dist.toFixed(1)} miles from {clients.find(c=>c.id===showLateForm)?.name}</div>
            <div style={{fontSize:10,opacity:.3,marginTop:6}}>📍 Your location: {calc.addr}</div>
          </div>;})()}
          <div className="fi" style={{marginBottom:14}}><label>Reason</label>
            <div className="eta-reasons">
              {["Traffic","Car trouble","Previous visit ran long","Personal emergency","Weather","Public transit delay","Other"].map(r=> <div key={r} className={`eta-reason ${lateReason===r?"sel":""}`} onClick={()=>setLateReason(r)}>{r}</div>)}
            </div>
          </div>
          <div className="fi" style={{marginBottom:14}}><label>Override ETA (minutes)</label>
            <div style={{display:"flex",gap:8,alignItems:"center"}}>
              {[5,10,15,20,30,45].map(m=> <button key={m} className={`btn btn-sm ${lateMinutes===m?"btn-p":"btn-s"}`} onClick={()=>setLateMinutes(m)}>{m}</button>)}
              <input type="number" value={lateMinutes} onChange={e=>setLateMinutes(+e.target.value)} style={{width:60,padding:"6px 8px",border:"var(--border-thin)",fontSize:13,textAlign:"center"}} min={1} max={120}/>
            </div>
          </div>
          <div className="late-notif">📨 This will notify: Office, assigned caregiver team, and family contacts (if enabled)</div>
          <div style={{display:"flex",gap:8,marginTop:14}}>
            <button className="btn btn-p" style={{flex:1,background:"#8a7356",borderColor:"#8a7356"}} onClick={()=>sendLateAlert(showLateForm)}>⏰ Send Late Alert with ETA</button>
            <button className="btn btn-s" onClick={()=>setShowLateForm(null)}>Cancel</button>
          </div>
        </div>
      </div>}

      {shift? <div>
        {/* Active Shift Panel */}
        <div className="clock-panel">
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
            <div>
              <div style={{fontSize:10,textTransform:"uppercase",letterSpacing:1.5,opacity:.4}}>{shift.onBreak?"On Break":"On Shift"}</div>
              <div style={{fontSize:18,fontWeight:500,marginTop:4}}>{shift.clientName}</div>
            </div>
            <div className={`geofence-badge ${shift.inFence?"geofence-in":"geofence-out"}`}>{shift.inFence?"Inside Geofence":"Outside Geofence"}</div>
          </div>
          <div className="timer">{String(Math.floor(workMin/60)).padStart(2,"0")}:{String(workMin%60).padStart(2,"0")}</div>
          <div className="shift-meta">
            <div className="sm-box"><div className="sm-label">Clock In</div><div className="sm-val">{fmtT(shift.clockInTime)}</div></div>
            <div className="sm-box"><div className="sm-label">Break</div><div className="sm-val">{Math.round(breakMin)}m</div></div>
            <div className="sm-box"><div className="sm-label">GPS Points</div><div className="sm-val">{gpsTrail.length}</div></div>
            <div className="sm-box"><div className="sm-label">Accuracy</div><div className="sm-val">{gpsTrail.length>0?`${gpsTrail[gpsTrail.length-1].accuracy.toFixed(0)}m`:"—"}</div></div>
          </div>
          <div className="gps-indicator"><div className="gps-dot"/>📍 {shift.clockInAddr}</div>
          {gpsTrail.length>0&& <div style={{fontSize:10,opacity:.3,marginTop:4}}>{gpsTrail[gpsTrail.length-1].lat.toFixed(5)}°N, {Math.abs(gpsTrail[gpsTrail.length-1].lng).toFixed(5)}°W</div>}
          <div className="gps-trail">{gpsTrail.slice(-80).map((_,i)=> <div key={i} className="dot" style={{opacity:.3+((i/80)*.7)}}/>)}</div>
          <div className="clock-btn-row">
            <button className={`clock-btn ${shift.onBreak?"clock-btn-in":"clock-btn-break"}`} onClick={toggleBreak}>{shift.onBreak?"▶ Resume":"⏸ Break"}</button>
            <button className="clock-btn clock-btn-out" onClick={clockOut}>⏹ Clock Out</button>
          </div>
        </div>

        {/* Quick Actions During Shift */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,marginBottom:16}}>
          <button className="btn btn-p" style={{padding:14,flexDirection:"column",gap:4}} onClick={()=>setModal("note")}>📝 Note</button>
          <button className="btn btn-s" style={{padding:14,flexDirection:"column",gap:4}} onClick={()=>{setShowExpForm(true);setExpForm(f=>({...f,clientId:shift.clientId}));}}>💰 Expense</button>
          <button className="btn btn-s" style={{padding:14,flexDirection:"column",gap:4}} onClick={()=>setModal("incident")}>⚠️ Incident</button>
          <button className="btn btn-s" style={{padding:14,flexDirection:"column",gap:4,color:"#8a7356",borderColor:"rgba(138,115,86,.3)"}} onClick={()=>{const nextCl=myClients.find(c=>c.id!==shift.clientId);if(nextCl)setShowLateForm(nextCl.id);}}>⏰ Late</button>
        </div>
      </div>

      : <div>
        {/* Clock In Selector */}
        <div style={{fontFamily:"var(--fd)",fontSize:18,marginBottom:16}}>Clock In</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr",gap:10}}>
          {myClients.map(cl=>{const loc=GPS_LOCATIONS[cl.id];const hasLateAlert=lateAlert&&lateAlert.clientId===cl.id;return <div key={cl.id} className="card" style={{overflow:"hidden"}}>
            {hasLateAlert&& <div style={{background:"rgba(138,115,86,.1)",padding:"8px 14px",display:"flex",alignItems:"center",gap:6,fontSize:11,color:"#8a7356",fontWeight:600,borderBottom:"var(--border-thin)"}}>⏰ Late alert sent — ETA {lateAlert.etaMinutes} min ({lateAlert.reason})</div>}
            <div className="card-b" style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div>
                <div style={{fontFamily:"var(--fd)",fontSize:16,fontWeight:400}}>{cl.name}</div>
                <div style={{fontSize:12,color:"var(--t2)",marginTop:2}}>📍 {loc?.addr||cl.addr}</div>
              </div>
              <div style={{display:"flex",gap:6}}>
                <button className="btn btn-sm btn-s" style={{color:"#8a7356",borderColor:"rgba(138,115,86,.3)"}} onClick={(e)=>{e.stopPropagation();setShowLateForm(cl.id);setLateMinutes(calcETA(cl.id).eta);}}>⏰ Late</button>
                <button className="btn btn-p" onClick={()=>clockIn(cl.id)}>Clock In →</button>
              </div>
            </div>
          </div>;})}
        </div>

        {/* Late Alert History */}
        {lateHistory.length>0&& <div className="card" style={{marginTop:16}}>
          <div className="card-h"><h3>Late Notifications Sent</h3></div>
          {lateHistory.map(la=> <div key={la.id} style={{padding:"10px 20px",borderBottom:"var(--border-thin)",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div>
              <div style={{fontWeight:600,fontSize:13}}>⏰ {la.clientName} — {la.reason}</div>
              <div style={{fontSize:11,color:"var(--t2)",marginTop:2}}>ETA {la.etaMinutes} min | {la.distance.toFixed(1)} mi | Sent {fmtT(la.sentAt)}</div>
              <div style={{fontSize:10,color:"var(--t3)",marginTop:1}}>📍 From: {la.currentAddr}</div>
            </div>
            <span className="tag tag-wn">Notified</span>
          </div>)}
        </div>}
      </div>}

      {/* Travel Summary */}
      {travel.miles>0&& <div className="card" style={{marginTop:16}}>
        <div className="card-h"><h3>Travel Today</h3><span className="tag tag-ok">{travel.miles.toFixed(1)} mi | ${(travel.miles*MILEAGE_RATE).toFixed(2)}</span></div>
        {travel.segments.map((seg,i)=> <div key={i} className="shift-history-item">
          <div><div style={{fontWeight:600,fontSize:13}}>{seg.from} → {seg.to}</div><div style={{fontSize:11,color:"var(--t2)"}}>{seg.miles.toFixed(1)} miles × ${MILEAGE_RATE}/mi</div></div>
          <div style={{fontFamily:"var(--fd)",fontSize:16,fontWeight:400}}>${(seg.miles*MILEAGE_RATE).toFixed(2)}</div>
        </div>)}
      </div>}

      {/* Shift History */}
      {shiftHistory.length>0&& <div className="card" style={{marginTop:16}}>
        <div className="card-h"><h3>Completed Shifts</h3></div>
        {shiftHistory.map(sh=> <div key={sh.id} className="shift-history-item">
          <div>
            <div style={{fontWeight:600,fontSize:13}}>{sh.clientName}</div>
            <div style={{fontSize:11,color:"var(--t2)"}}>{fmtT(sh.clockInTime)} — {fmtT(sh.clockOutTime)} | {hrsMin(sh.workMins)} worked | {sh.breakMins}m break</div>
            <div style={{fontSize:10,color:"var(--t2)",marginTop:2}}>📍 {sh.clockInAddr} | {sh.gpsPoints} GPS points</div>
          </div>
          <span className="tag tag-ok">Complete</span>
        </div>)}
      </div>}
    </div>}

    {/* ═══ SCHEDULE ═══ */}
    {tab==="schedule"&& <CGScheduleView user={user} schedules={schedules} clients={clients}/>}

    {/* ═══ CLIENTS ═══ */}
    {tab==="clients"&& <div>
      {myClients.map(cl=> <div key={cl.id} className="card card-b">
        <div style={{display:"flex",gap:14,alignItems:"center",marginBottom:12}}>
          <div className="avatar" style={{width:48,height:48,fontSize:16,background:"#111",color:"#fff"}}>{cl.name.split(" ").map(n=>n[0]).join("")}</div>
          <div style={{flex:1}}><div style={{fontFamily:"var(--fd)",fontSize:18,fontWeight:400}}>{cl.name}</div><div style={{fontSize:12,color:"var(--t2)"}}>{cl.addr}</div></div>
          <span className={`tag tag-${cl.riskLevel==="low"?"ok":cl.riskLevel==="medium"?"wn":"er"}`}>{cl.riskLevel}</span>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
          <div style={{background:"var(--bg)",padding:10}}><div style={{fontSize:9,color:"var(--t2)",textTransform:"uppercase",letterSpacing:.5}}>Diagnoses</div><div style={{fontSize:12,fontWeight:600,marginTop:2}}>{cl.dx.length}</div></div>
          <div style={{background:"var(--bg)",padding:10}}><div style={{fontSize:9,color:"var(--t2)",textTransform:"uppercase",letterSpacing:.5}}>Medications</div><div style={{fontSize:12,fontWeight:600,marginTop:2}}>{cl.meds.length}</div></div>
          <div style={{background:"var(--bg)",padding:10}}><div style={{fontSize:9,color:"var(--t2)",textTransform:"uppercase",letterSpacing:.5}}>Diet</div><div style={{fontSize:12,fontWeight:600,marginTop:2}}>{cl.preferences.diet}</div></div>
        </div>
      </div>)}
    </div>}

    {/* ═══ NOTES ═══ */}
    {tab==="notes"&& <div>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:14}}><h3 style={{fontFamily:"var(--fd)",fontSize:16}}>My Care Notes</h3><button className="btn btn-p btn-sm" onClick={()=>setModal("note")}>+ New Note</button></div>
      <div className="card">{myNotes.map(n=>{const cl=clients.find(c=>c.id===n.clientId);return <div key={n.id} style={{padding:"12px 20px",borderBottom:"var(--border-thin)"}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:4,fontSize:11}}><div style={{display:"flex",gap:6}}><span className={`tag ${n.category==="Health"?"tag-er":n.category==="ADL"?"tag-bl":"tag-ok"}`}>{n.category}</span><span style={{fontWeight:600}}>{cl?.name}</span></div><span style={{color:"var(--t2)"}}>{fmtD(n.date)}</span></div>
        <div style={{fontSize:13,lineHeight:1.6}}>{n.text}</div>
      </div>;})}
      {myNotes.length===0&& <div className="empty">No care notes yet</div>}
      </div>
    </div>}

    {/* ═══ EXPENSES ═══ */}
    {tab==="expenses"&& <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
        <h3 style={{fontFamily:"var(--fd)",fontSize:16}}>My Expenses</h3>
        <button className="btn btn-p btn-sm" onClick={()=>setShowExpForm(!showExpForm)}>+ Log Expense</button>
      </div>

      <div className="cg-stat-grid" style={{gridTemplateColumns:"repeat(4,1fr)"}}>
        <div className="cg-stat"><div className="lbl">Pending</div><div className="val" style={{color:"var(--ochre)"}}>${myExpenses.filter(e=>e.status==="pending").reduce((s,e)=>s+e.amount,0).toFixed(2)}</div></div>
        <div className="cg-stat"><div className="lbl">Approved</div><div className="val" style={{color:"var(--ok)"}}>${myExpenses.filter(e=>e.status==="approved").reduce((s,e)=>s+e.amount,0).toFixed(2)}</div></div>
        <div className="cg-stat"><div className="lbl">Travel Miles</div><div className="val">{travel.miles.toFixed(1)}</div></div>
        <div className="cg-stat"><div className="lbl">Travel $</div><div className="val">${(travel.miles*MILEAGE_RATE).toFixed(2)}</div></div>
      </div>

      {/* Expense Submission Form */}
      {showExpForm&& <div className="card">
        <div className="card-h"><h3>Submit Expense</h3></div>
        <div className="exp-submit-form">
          <div className="fg" style={{marginBottom:12}}>
            <div className="fi"><label>Client</label><select value={expForm.clientId} onChange={e=>setExpForm(f=>({...f,clientId:e.target.value}))}><option value="">Select</option>{myClients.map(c=> <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
            <div className="fi"><label>Category</label><select value={expForm.category} onChange={e=>setExpForm(f=>({...f,category:e.target.value}))}>{EXP_CATEGORIES.map(c=> <option key={c} value={c}>{c}</option>)}</select></div>
          </div>
          <div className="fg" style={{marginBottom:12}}>
            <div className="fi" style={{gridColumn:"span 2"}}><label>Description</label><input value={expForm.description} onChange={e=>setExpForm(f=>({...f,description:e.target.value}))} placeholder={expForm.category==="Mileage"?"e.g. Round trip to client":"Describe purchase"}/></div>
            {expForm.category==="Mileage"? <div className="fg" style={{gap:8}}>
              <div className="fi"><label>Miles</label><input type="number" value={expForm.quantity||""} onChange={e=>setExpForm(f=>({...f,quantity:+e.target.value}))} step="0.1"/></div>
              <div className="fi"><label>IRS Rate</label><input value={`$${MILEAGE_RATE}/mi`} readOnly style={{background:"var(--bg)"}}/></div>
              <div className="fi"><label>Total</label><input value={`$${(expForm.quantity*MILEAGE_RATE).toFixed(2)}`} readOnly style={{background:"var(--bg)",fontWeight:700}}/></div>
            </div>
            : <div className="fi"><label>Amount ($)</label><input type="number" value={expForm.amount||""} onChange={e=>setExpForm(f=>({...f,amount:+e.target.value}))} step="0.01"/></div>}
          </div>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}>
            <input type="checkbox" checked={expForm.receipt} onChange={e=>setExpForm(f=>({...f,receipt:e.target.checked}))}/><label style={{fontSize:13}}>Receipt photo captured</label>
          </div>
          {expForm.clientId&&GPS_LOCATIONS[expForm.clientId]&& <div style={{fontSize:11,color:"var(--t2)",marginBottom:10}}>📍 GPS: {GPS_LOCATIONS[expForm.clientId].addr}</div>}
          <div style={{display:"flex",gap:8}}><button className="btn btn-p" onClick={submitExpense} disabled={!expForm.description||!expForm.clientId}>Submit</button><button className="btn btn-s" onClick={()=>setShowExpForm(false)}>Cancel</button></div>
        </div>
      </div>}

      {/* Auto-Travel Mileage */}
      {travel.segments.length>0&& <div className="card">
        <div className="card-h"><h3>Auto-Tracked Mileage (GPS)</h3><span className="tag tag-ok">GPS</span></div>
        {travel.segments.map((seg,i)=> <div key={i} className="shift-history-item">
          <div><div style={{fontWeight:600,fontSize:13}}>{seg.from} → {seg.to}</div><div style={{fontSize:11,color:"var(--t2)"}}>{seg.miles.toFixed(1)} mi × ${MILEAGE_RATE}/mi</div></div>
          <div style={{fontFamily:"var(--fd)",fontSize:16}}>${(seg.miles*MILEAGE_RATE).toFixed(2)}</div>
        </div>)}
      </div>}

      {/* Expense History */}
      <div className="card"><div className="card-h"><h3>Submitted Expenses</h3></div>
        <div className="tw"><table><thead><tr><th>Date</th><th>Client</th><th>Category</th><th>Description</th><th>GPS</th><th>Receipt</th><th style={{textAlign:"right"}}>Amount</th><th>Status</th></tr></thead><tbody>
          {myExpenses.sort((a,b)=>b.date.localeCompare(a.date)).map(e=>{const cl=clients.find(c=>c.id===e.clientId);return <tr key={e.id}><td>{fmtD(e.date)}</td><td style={{fontWeight:600}}>{cl?.name||"—"}</td><td><span className="tag tag-bl">{e.category}</span></td><td>{e.description}</td><td style={{fontSize:10}} title={e.gps}>{e.gps?"📍 "+e.gps.split(",")[0]:"—"}</td><td>{e.receipt?"📷":"—"}</td><td style={{textAlign:"right",fontWeight:600}}>${e.amount.toFixed(2)}</td><td><span className={`tag ${e.status==="approved"?"tag-ok":"tag-wn"}`}>{e.status}</span></td></tr>;})}
        </tbody></table></div>
        {myExpenses.length===0&& <div className="empty">No expenses submitted yet</div>}
      </div>
    </div>}

    {/* ═══ TRAINING ═══ */}
    {tab==="training"&& <div>
      <div style={{marginBottom:16}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}><span style={{fontSize:12,color:"var(--t2)"}}>Progress: {myTraining.length}/{TRAINING_MODULES.length} modules</span><span style={{fontSize:14,fontWeight:600}}>{pct}%</span></div>
        <div className="progress-bar"><div className="progress-fill" style={{width:`${pct}%`,background:pct===100?"var(--ok)":"var(--blue)"}}/></div>
      </div>
      {TRAINING_MODULES.map((mod,idx)=>{const done=myTraining.includes(idx);return <div key={mod.id} className="card card-b" style={{display:"flex",justifyContent:"space-between",alignItems:"center",opacity:done?.6:1}}>
        <div><div style={{fontWeight:600,fontSize:13}}>{mod.title}</div><div style={{fontSize:11,color:"var(--t2)",marginTop:2}}>{mod.category} | {mod.duration} | {mod.lessons.length} lessons</div></div>
        {done? <span className="tag tag-ok">Complete</span>:<button className="btn btn-sm btn-p" onClick={()=>setTrainingProgress(p=>({...p,[user.caregiverId]:[...(p[user.caregiverId]||[]),idx]}))}>Start</button>}
      </div>;})}
    </div>}

    {/* ═══ MESSAGES ═══ */}
    {tab==="messages"&& <div>
      <div className="card" style={{maxHeight:"60vh",display:"flex",flexDirection:"column"}}>
        <div className="card-h"><h3>Team Messages</h3></div>
        <div style={{flex:1,overflow:"auto",padding:"14px 20px",display:"flex",flexDirection:"column",gap:6}}>
          {familyMsgs.filter(m=>myClients.some(c=>c.id===m.clientId)).map(m=> <div key={m.id} style={{display:"flex",flexDirection:"column",alignItems:m.from===user.name?"flex-end":"flex-start"}}>
            <div className="chat-meta">{m.from} | {fmtRel(m.date)}</div>
            <div className={`chat-bubble ${m.from===user.name?"chat-fam":"chat-cg"}`}>{m.text}</div>
          </div>)}
        </div>
      </div>
    </div>}

    {/* ═══ MODALS ═══ */}
    {modal==="note"&& <div className="modal-bg" onClick={()=>setModal(null)}><div className="modal" onClick={e=>e.stopPropagation()}>
      <div className="modal-h">New Care Note<button className="btn btn-sm btn-s" onClick={()=>setModal(null)}>✕</button></div>
      <NoteForm clients={myClients.length>0?myClients:clients} caregivers={[cg].filter(Boolean)} onSave={n=>{setCareNotes(p=>[{id:"CN"+uid(),...n,caregiverId:user.caregiverId,date:now().toISOString()},...p]);setModal(null);}}/>
    </div></div>}
    {modal==="incident"&& <div className="modal-bg" onClick={()=>setModal(null)}><div className="modal" onClick={e=>e.stopPropagation()}>
      <div className="modal-h">Incident Report<button className="btn btn-sm btn-s" onClick={()=>setModal(null)}>✕</button></div>
      <IncidentForm clients={myClients.length>0?myClients:clients} caregivers={[cg].filter(Boolean)} onSave={inc=>{setIncidents(p=>[{id:"IR"+uid(),...inc,caregiverId:user.caregiverId,date:now().toISOString(),status:"open"},...p]);setModal(null);}}/>
    </div></div>}
  </div>;
}

// ═══════════════════════════════════════════════════════════════════════
// FAMILY STANDALONE PORTAL
// ═══════════════════════════════════════════════════════════════════════
function FamilyStandalonePortal({user,clients,caregivers,careNotes,events,familyMsgs,setFamilyMsgs,incidents}){
  const cl=clients.find(c=>c.id===user.clientId)||clients[0];
  const [msgText,setMsgText]=useState("");
  const clNotes=careNotes.filter(n=>n.clientId===cl.id).sort((a,b)=>new Date(b.date)-new Date(a.date));
  const clEvents=events.filter(e=>e.clientId===cl.id&&new Date(e.date)>=now());
  const clMsgs=familyMsgs.filter(m=>m.clientId===cl.id).sort((a,b)=>new Date(a.date)-new Date(b.date));
  const clInc=incidents.filter(i=>i.clientId===cl.id&&i.familyNotified);
  const sendMsg=()=>{if(!msgText.trim())return;setFamilyMsgs(p=>[...p,{id:"FM"+uid(),clientId:cl.id,from:user.name,fromType:"family",date:now().toISOString(),text:msgText}]);setMsgText("");};
  const [tab,setTab]=useState("updates");

  return <div>
    <div className="cg-header">
      <div><div style={{fontSize:11,textTransform:"uppercase",letterSpacing:1.5,opacity:.3,marginBottom:4}}>Family Portal</div><h2>{cl.name}'s Care</h2></div>
      <div className="cg-meta"><div>Logged in as {user.name}</div><div>{user.title}</div></div>
    </div>
    <div className="tab-row">
      {["updates","messages","events","incidents"].map(t=> <button key={t} className={`tab-btn ${tab===t?"act":""}`} onClick={()=>setTab(t)}>{({updates:"Care Updates",messages:"Messages",events:"Events",incidents:"Incidents"})[t]}</button>)}
    </div>

    {tab==="updates"&& <div className="card">{clNotes.slice(0,10).map(n=>{const cg=caregivers.find(c=>c.id===n.caregiverId);return <div key={n.id} style={{padding:"12px 20px",borderBottom:"var(--border-thin)"}}>
      <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:"var(--t2)",marginBottom:4}}><span style={{fontWeight:600}}>{cg?.name}</span><span>{fmtD(n.date)} {fmtT(n.date)}</span></div>
      <div style={{fontSize:13,lineHeight:1.6}}>{n.text}</div>
    </div>;})}
    {clNotes.length===0&& <div className="empty">No updates yet</div>}
    </div>}

    {tab==="messages"&& <div className="card" style={{maxHeight:"65vh",display:"flex",flexDirection:"column"}}>
      <div className="card-h"><h3>Messages with Care Team</h3></div>
      <div style={{flex:1,overflow:"auto",padding:"14px 20px",display:"flex",flexDirection:"column",gap:6}}>
        {clMsgs.map(m=> <div key={m.id} style={{display:"flex",flexDirection:"column",alignItems:m.from===user.name?"flex-end":"flex-start"}}>
          <div className="chat-meta">{m.from} | {fmtRel(m.date)}</div>
          <div className={`chat-bubble ${m.from===user.name?"chat-fam":"chat-cg"}`}>{m.text}</div>
        </div>)}
      </div>
      <div style={{padding:"10px 14px",borderTop:"var(--border-thin)",display:"flex",gap:8}}>
        <input value={msgText} onChange={e=>setMsgText(e.target.value)} placeholder="Message the care team..." style={{flex:1,padding:"8px 12px",border:"var(--border-thin)",fontSize:13,fontFamily:"var(--f)"}} onKeyDown={e=>e.key==="Enter"&&sendMsg()}/>
        <button className="btn btn-p btn-sm" onClick={sendMsg} disabled={!msgText.trim()}>Send</button>
      </div>
    </div>}

    {tab==="events"&& <div className="card">{clEvents.map(ev=> <div key={ev.id} style={{padding:"12px 20px",borderBottom:"var(--border-thin)",display:"flex",justifyContent:"space-between"}}>
      <div><div style={{fontWeight:600,fontSize:14}}>{ev.title}</div><div style={{fontSize:12,color:"var(--t2)"}}>{fmtD(ev.date)}</div></div>
      <span className={`tag ${ev.type==="medical"?"tag-er":"tag-bl"}`}>{ev.type}</span>
    </div>)}{clEvents.length===0&& <div className="empty">No upcoming events</div>}</div>}

    {tab==="incidents"&& <div className="card">{clInc.map(inc=> <div key={inc.id} style={{padding:"12px 20px",borderBottom:"var(--border-thin)"}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}><span className={`tag ${inc.severity==="low"?"tag-wn":"tag-er"}`}>{inc.type} ({inc.severity})</span><span style={{fontSize:11,color:"var(--t2)"}}>{fmtD(inc.date)}</span></div>
      <div style={{fontSize:13,lineHeight:1.6}}>{inc.description}</div>
      {inc.followUp&& <div style={{fontSize:12,color:"var(--t2)",marginTop:6,padding:"6px 10px",background:"var(--bg)"}}><strong>Follow-up:</strong> {inc.followUp}</div>}
    </div>)}{clInc.length===0&& <div className="empty">No incidents reported</div>}</div>}
  </div>;
}

// ═══════════════════════════════════════════════════════════════════════
// USER MANAGEMENT (Owner/Admin only)
// ═══════════════════════════════════════════════════════════════════════
function UserManagementPage({allUsers,setAllUsers}){
  const [showAdd,setShowAdd]=useState(false);
  const [editUser,setEditUser]=useState(null);
  const [f,sF]=useState({email:"",pin:"",name:"",role:"caregiver",phone:"",title:"",active:true});

  const save=()=>{
    if(!f.email||!f.name||!f.pin)return;
    if(editUser){
      setAllUsers(p=>p.map(u=>u.id===editUser.id?{...editUser,...f,avatar:f.name.split(" ").map(n=>n[0]).join("").slice(0,2)}:u));
    } else {
      setAllUsers(p=>[...p,{id:"U"+uid(),...f,avatar:f.name.split(" ").map(n=>n[0]).join("").slice(0,2)}]);
    }
    sF({email:"",pin:"",name:"",role:"caregiver",phone:"",title:"",active:true});
    setShowAdd(false);setEditUser(null);
  };

  const deactivate=(id)=>setAllUsers(p=>p.map(u=>u.id===id?{...u,active:!u.active}:u));
  const byRole=(r)=>allUsers.filter(u=>u.role===r);

  return <div>
    <div className="hdr"><div><h2>User Management</h2><div className="hdr-sub">{allUsers.length} accounts | {allUsers.filter(u=>u.active).length} active</div></div>
      <button className="btn btn-p btn-sm" onClick={()=>{setShowAdd(true);setEditUser(null);sF({email:"",pin:"",name:"",role:"caregiver",phone:"",title:"",active:true});}}>+ Add User</button>
    </div>

    <div className="sg">
      {Object.entries(ROLES).map(([key,r])=> <div key={key} className="sc"><span className="sl">{r.label}s</span><span className="sv">{byRole(key).length}</span><span className="ss">{byRole(key).filter(u=>u.active).length} active</span></div>)}
    </div>

    {(showAdd||editUser)&& <div className="card card-b" style={{borderLeft:"3px solid var(--black)"}}>
      <h3 style={{fontFamily:"var(--fd)",fontSize:16,fontWeight:400,marginBottom:14}}>{editUser?"Edit User":"Add New User"}</h3>
      <div className="fg" style={{marginBottom:12}}>
        <div className="fi"><label>Full Name</label><input value={f.name} onChange={e=>sF({...f,name:e.target.value})} placeholder="Jane Smith"/></div>
        <div className="fi"><label>Email</label><input type="email" value={f.email} onChange={e=>sF({...f,email:e.target.value})} placeholder="jane@cwinathome.com"/></div>
        <div className="fi"><label>PIN (4 digits)</label><input type="password" maxLength={4} value={f.pin} onChange={e=>sF({...f,pin:e.target.value})} placeholder="••••"/></div>
        <div className="fi"><label>Role</label><select value={f.role} onChange={e=>sF({...f,role:e.target.value})}>{Object.entries(ROLES).map(([k,r])=> <option key={k} value={k}>{r.label}</option>)}</select></div>
        <div className="fi"><label>Phone</label><input value={f.phone} onChange={e=>sF({...f,phone:e.target.value})}/></div>
        <div className="fi"><label>Title</label><input value={f.title} onChange={e=>sF({...f,title:e.target.value})} placeholder="CNA, Office Admin, etc."/></div>
      </div>
      <div style={{display:"flex",gap:8}}><button className="btn btn-p" onClick={save}>Save</button><button className="btn btn-s" onClick={()=>{setShowAdd(false);setEditUser(null);}}>Cancel</button></div>
    </div>}

    <div className="card"><div className="card-h"><h3>All Users</h3></div>
      <div className="tw"><table><thead><tr><th></th><th>Name</th><th>Email</th><th>Role</th><th>Title</th><th>Phone</th><th>Status</th><th>Actions</th></tr></thead><tbody>
        {allUsers.map(u=> <tr key={u.id} style={{opacity:u.active?1:.45}}>
          <td><div className="avatar" style={{width:32,height:32,fontSize:10,background:ROLES[u.role]?.color||"#111",color:"#fff"}}>{u.avatar}</div></td>
          <td style={{fontWeight:600}}>{u.name}</td>
          <td style={{fontSize:11}}>{u.email}</td>
          <td><span className="tag tag-bl">{ROLES[u.role]?.label}</span></td>
          <td style={{fontSize:12,color:"var(--t2)"}}>{u.title}</td>
          <td style={{fontSize:12}}>{u.phone}</td>
          <td>{u.active? <span className="tag tag-ok">Active</span>:<span className="tag tag-er">Inactive</span>}</td>
          <td><div style={{display:"flex",gap:4}}>
            <button className="btn btn-sm btn-s" onClick={()=>{setEditUser(u);sF({email:u.email,pin:u.pin,name:u.name,role:u.role,phone:u.phone,title:u.title,active:u.active});setShowAdd(true);}}>Edit</button>
            <button className="btn btn-sm btn-s" onClick={()=>deactivate(u.id)}>{u.active?"Deactivate":"Activate"}</button>
          </div></td>
        </tr>)}
      </tbody></table></div>
    </div>
  </div>;
}

// ═══════════════════════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════════════════════
export default function App(){
  const [user,setUser]=useState(null);
  const [allUsers,setAllUsers]=useState(USERS);
  const [pg,setPg]=useState("dash");
  const [clients,setClients]=useState(CLIENTS);
  const [caregivers]=useState(CAREGIVERS);
  const [chores,setChores]=useState(seedChores);
  const [incidents,setIncidents]=useState(seedIncidents);
  const [careNotes,setCareNotes]=useState(seedCareNotes);
  const [expenses,setExpenses]=useState(seedExpenses);
  const [events,setEvents]=useState(seedEvents);
  const [familyMsgs,setFamilyMsgs]=useState(seedFamilyMessages);
  const [trainingProgress,setTrainingProgress]=useState({"CG1":[0,1,2,3,4,5,6,7],"CG2":[0,1,2,3,8],"CG3":[0,1,2,3,4,5,6,7,8,10],"CG4":[0,1,2,3,4,5,9]});
  const [modal,setModal]=useState(null);
  const [selClient,setSelClient]=useState("CL1");
  const [selCG,setSelCG]=useState("");
  const [serviceRequests,setServiceRequests]=useState(seedServiceRequests);
  const [surveys,setSurveys]=useState(seedSurveys);
  const [careGoals,setCareGoals]=useState(seedCareGoals);
  const [vitals,setVitals]=useState(seedVitals);
  const [documents]=useState(seedDocuments);
  const [portalClient,setPortalClient]=useState("CL1");
  const [cgApplicants,setCGApplicants]=useState(seedCGApplicants);
  const [clientLeads,setClientLeads]=useState(seedClientLeads);
  const [compliance,setCompliance]=useState(seedComplianceItems);
  const [campaigns,setCampaigns]=useState(seedCampaigns);
  const [reconEntries]=useState(seedReconEntries);
  const [schedules,setSchedules]=useState(seedSchedules);

  const openInc=incidents.filter(i=>i.status==="open").length;
  const pendExp=expenses.filter(e=>e.status==="pending").length;
  const cl=clients.find(c=>c.id===selClient)||clients[0];

  const overdue=compliance.filter(c=>c.status==="overdue").length;
  const expSoon=compliance.filter(c=>c.status==="expiring_soon").length;
  const flaggedRecon=reconEntries.filter(r=>r.status==="flagged"||r.status==="review").length;
  const newApps=cgApplicants.filter(a=>a.status==="new").length+clientLeads.filter(l=>l.status==="new"||l.status==="inquiry").length;

  const draftScheds=schedules.filter(s=>s.status==="draft").length;

  const nav=[
    {sec:"Overview"},{key:"dash",label:"Command Center",ico:"⚡"},
    {sec:"Operations"},{key:"schedule",label:"Scheduling",ico:"📅",badge:draftScheds||null},{key:"clients",label:"Client Profiles",ico:"👤"},{key:"care",label:"Care Management",ico:"📋",badge:openInc||null},{key:"recon",label:"Reconciliation",ico:"🔍",badge:flaggedRecon||null},{key:"expenses",label:"Expenses",ico:"💰",badge:pendExp||null},
    {sec:"Growth"},{key:"training",label:"Training Academy",ico:"🎓"},{key:"recruiting",label:"Recruiting",ico:"📢",badge:newApps||null},{key:"marketing",label:"Marketing",ico:"📈"},{key:"events",label:"Events & Wellness",ico:"🌱"},
    {sec:"Compliance"},{key:"compliance",label:"Compliance Center",ico:"🛡️",badge:overdue||null},
    {sec:"Connections"},{key:"portal",label:"Client Portal",ico:"🏠"},{key:"family",label:"Family Portal",ico:"👨‍👩‍👧"},{key:"team",label:"Team",ico:"👥"},
    {sec:"Admin"},{key:"users",label:"User Management",ico:"🔐"},
  ];

  // Role-based nav filtering
  const userPerms=user?PERMS[user.role]:[];
  const filteredNav=nav.filter(n=>{
    if(n.sec)return true;
    return userPerms.includes(n.key);
  });
  // Remove empty sections (section with no items after it)
  const cleanNav=filteredNav.filter((n,i,arr)=>{
    if(!n.sec)return true;
    const nextItem=arr[i+1];
    return nextItem&&!nextItem.sec;
  });

  const logout=()=>{setUser(null);setPg("dash");};

  // ── LOGIN GATE ──
  if(!user) return <><style>{CSS}</style><LoginScreen onLogin={(u)=>{
    setUser(u);
    if(u.role==="caregiver")setPg("cg_home");
    else if(u.role==="client")setPg("cl_home");
    else if(u.role==="family")setPg("fm_home");
    else setPg("dash");
  }}/></>;

  // ── CAREGIVER PORTAL ──
  if(user.role==="caregiver") return <><style>{CSS}</style><div className="app">
    <div className="sb">
      <div className="sb-logo"><Logo s={44} c="#fff"/><div><h1>CWIN</h1><p>{CO.tag}</p></div></div>
      <nav style={{flex:1,paddingTop:4}}/>
      <div className="user-bar" onClick={logout}>
        <div className="avatar" style={{width:30,height:30,fontSize:10,background:"rgba(255,255,255,.1)",color:"#fff"}}>{user.avatar}</div>
        <div><div className="ub-name">{user.name}</div><div className="ub-role">{ROLES[user.role]?.label}</div></div>
      </div>
    </div>
    <div className="main">
      <CaregiverPortal user={user} clients={clients} caregivers={caregivers} careNotes={careNotes} setCareNotes={setCareNotes} incidents={incidents} setIncidents={setIncidents} expenses={expenses} setExpenses={setExpenses} events={events} chores={chores} schedules={schedules} trainingProgress={trainingProgress} setTrainingProgress={setTrainingProgress} familyMsgs={familyMsgs} setFamilyMsgs={setFamilyMsgs} modal={modal} setModal={setModal}/>
    </div>
  </div></>;

  // ── CLIENT PORTAL ──
  if(user.role==="client") return <><style>{CSS}</style><div className="app">
    <div className="sb">
      <div className="sb-logo"><Logo s={44} c="#fff"/><div><h1>CWIN</h1><p>{CO.tag}</p></div></div>
      <nav style={{flex:1,paddingTop:4}}/>
      <div className="user-bar" onClick={logout}>
        <div className="avatar" style={{width:30,height:30,fontSize:10,background:"rgba(255,255,255,.1)",color:"#fff"}}>{user.avatar}</div>
        <div><div className="ub-name">{user.name}</div><div className="ub-role">{ROLES[user.role]?.label}</div></div>
      </div>
    </div>
    <div className="main">
      <ClientPortalPage clients={clients} caregivers={caregivers} sel={user.clientId||"CL1"} setSel={()=>{}} serviceRequests={serviceRequests} setServiceRequests={setServiceRequests} surveys={surveys} setSurveys={setSurveys} careGoals={careGoals} vitals={vitals} setVitals={setVitals} documents={documents} careNotes={careNotes} events={events} expenses={expenses} familyMsgs={familyMsgs} setFamilyMsgs={setFamilyMsgs}/>
    </div>
  </div></>;

  // ── FAMILY PORTAL ──
  if(user.role==="family") return <><style>{CSS}</style><div className="app">
    <div className="sb">
      <div className="sb-logo"><Logo s={44} c="#fff"/><div><h1>CWIN</h1><p>{CO.tag}</p></div></div>
      <nav style={{flex:1,paddingTop:4}}/>
      <div className="user-bar" onClick={logout}>
        <div className="avatar" style={{width:30,height:30,fontSize:10,background:"rgba(255,255,255,.1)",color:"#fff"}}>{user.avatar}</div>
        <div><div className="ub-name">{user.name}</div><div className="ub-role">{ROLES[user.role]?.label}</div></div>
      </div>
    </div>
    <div className="main">
      <FamilyStandalonePortal user={user} clients={clients} caregivers={caregivers} careNotes={careNotes} events={events} familyMsgs={familyMsgs} setFamilyMsgs={setFamilyMsgs} incidents={incidents}/>
    </div>
  </div></>;

  // ── ADMIN / OWNER / MANAGER ──
  return <><style>{CSS}</style><div className="app">
    <div className="sb">
      <div className="sb-logo"><Logo s={44} c="#fff"/><div><h1>CWIN</h1><p>{CO.tag}</p></div></div>
      <nav style={{flex:1,paddingTop:4}}>
        {cleanNav.map((n,i)=>n.sec?<div key={i} className="sb-sec">{n.sec}</div>
          :<div key={n.key} className={`ni ${pg===n.key?"act":""}`} onClick={()=>setPg(n.key)}>
            <span className="ico">{n.ico}</span><span>{n.label}</span>
            {n.badge&&<span className="badge">{n.badge}</span>}
          </div>)}
      </nav>
      <div className="user-bar" onClick={logout}>
        <div className="avatar" style={{width:30,height:30,fontSize:10,background:"rgba(255,255,255,.1)",color:"#fff"}}>{user.avatar}</div>
        <div><div className="ub-name">{user.name}</div><div className="ub-role">{ROLES[user.role]?.label} | Sign Out</div></div>
      </div>
    </div>

    <div className="main">
      {pg==="dash"&&<DashPage clients={clients} caregivers={caregivers} incidents={incidents} expenses={expenses} careNotes={careNotes} events={events} trainingProgress={trainingProgress} schedules={schedules} setPg={setPg}/>}
      {pg==="schedule"&&<SchedulePage schedules={schedules} setSchedules={setSchedules} clients={clients} caregivers={caregivers}/>}
      {pg==="clients"&&<ClientsPage clients={clients} setClients={setClients} sel={selClient} setSel={setSelClient} caregivers={caregivers} careNotes={careNotes} incidents={incidents} events={events} chores={chores} expenses={expenses} schedules={schedules}/>}
      {pg==="care"&&<CarePage clients={clients} caregivers={caregivers} chores={chores} setChores={setChores} incidents={incidents} setIncidents={setIncidents} careNotes={careNotes} setCareNotes={setCareNotes} modal={modal} setModal={setModal}/>}
      {pg==="expenses"&&<ExpensesPage expenses={expenses} setExpenses={setExpenses} caregivers={caregivers} clients={clients}/>}
      {pg==="recon"&&<ReconPage entries={reconEntries} caregivers={caregivers} clients={clients}/>}
      {pg==="recruiting"&&<RecruitingPage applicants={cgApplicants} setApplicants={setCGApplicants} leads={clientLeads} setLeads={setClientLeads}/>}
      {pg==="marketing"&&<MarketingPage campaigns={campaigns} setCampaigns={setCampaigns} leads={clientLeads} applicants={cgApplicants}/>}
      {pg==="compliance"&&<CompliancePage items={compliance} setItems={setCompliance} caregivers={caregivers} clients={clients}/>}
      {pg==="training"&&<TrainingPage caregivers={caregivers} progress={trainingProgress} setProgress={setTrainingProgress} modal={modal} setModal={setModal}/>}
      {pg==="events"&&<EventsPage events={events} setEvents={setEvents} clients={clients}/>}
      {pg==="portal"&&<ClientPortalPage clients={clients} caregivers={caregivers} sel={portalClient} setSel={setPortalClient} serviceRequests={serviceRequests} setServiceRequests={setServiceRequests} surveys={surveys} setSurveys={setSurveys} careGoals={careGoals} vitals={vitals} setVitals={setVitals} documents={documents} careNotes={careNotes} events={events} expenses={expenses} familyMsgs={familyMsgs} setFamilyMsgs={setFamilyMsgs}/>}
      {pg==="family"&&<FamilyPage clients={clients} familyMsgs={familyMsgs} setFamilyMsgs={setFamilyMsgs} careNotes={careNotes} incidents={incidents} events={events}/>}
      {pg==="team"&&<TeamPage caregivers={caregivers} progress={trainingProgress}/>}
      {pg==="users"&&<UserManagementPage allUsers={allUsers} setAllUsers={setAllUsers}/>}
    </div>
  </div></>;
}

// ═══════════════════════════════════════════════════════════════════════
// DASHBOARD
// ═══════════════════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════════════════
// SCHEDULE PAGE — Admin/Owner/Manager
// ═══════════════════════════════════════════════════════════════════════
function SchedulePage({schedules,setSchedules,clients,caregivers}){
  const [weekStart,setWeekStart]=useState(getMonday(now()));
  const [selDay,setSelDay]=useState(toISO(now()));
  const [editShift,setEditShift]=useState(null);
  const [showCreate,setShowCreate]=useState(false);
  const [filterCG,setFilterCG]=useState("");
  const [showCopy,setShowCopy]=useState(false);
  const [showPublish,setShowPublish]=useState(false);

  const weekDates=Array.from({length:7},(_,i)=>addDays(weekStart,i));
  const weekEnd=addDays(weekStart,6);
  const weekScheds=schedules.filter(s=>s.date>=toISO(weekStart)&&s.date<=toISO(weekEnd));
  const dayScheds=schedules.filter(s=>s.date===selDay&&(!filterCG||s.caregiverId===filterCG));
  const drafts=weekScheds.filter(s=>s.status==="draft");
  const weekHrs=weekScheds.reduce((s,sh)=>s+(timeToMin(sh.endTime)-timeToMin(sh.startTime))/60,0);

  // Conflict detection
  const conflicts=dayScheds.filter((s,i)=>dayScheds.some((s2,j)=>i!==j&&s.caregiverId===s2.caregiverId&&timeToMin(s.startTime)<timeToMin(s2.endTime)&&timeToMin(s2.startTime)<timeToMin(s.endTime)));

  const publishDay=()=>setSchedules(p=>p.map(s=>s.date===selDay&&s.status==="draft"?{...s,status:"published"}:s));
  const publishWeek=()=>{setSchedules(p=>p.map(s=>s.date>=toISO(weekStart)&&s.date<=toISO(weekEnd)&&s.status==="draft"?{...s,status:"published"}:s));setShowPublish(false);};
  const deleteShift=id=>setSchedules(p=>p.filter(s=>s.id!==id));
  const duplicateShift=sh=>setSchedules(p=>[...p,{...sh,id:"SC"+uid(),status:"draft"}]);
  const goToday=()=>{setWeekStart(getMonday(now()));setSelDay(toISO(now()));};

  const copyWeekTo=targetMon=>{
    const newShifts=weekScheds.map(s=>{const dayIdx=weekDates.findIndex(d=>toISO(d)===s.date);const nd=toISO(addDays(targetMon,dayIdx>=0?dayIdx:0));return{...s,id:"SC"+uid(),date:nd,status:"draft"};});
    setSchedules(p=>[...p,...newShifts]);setShowCopy(false);setWeekStart(targetMon);
  };

  const saveShift=data=>{
    if(data.id&&schedules.some(s=>s.id===data.id)) setSchedules(p=>p.map(s=>s.id===data.id?{...data}:s));
    else setSchedules(p=>[...p,{...data,id:"SC"+uid()}]);
    setEditShift(null);setShowCreate(false);
  };

  // ─── CREATE/EDIT FORM ───
  const ShiftForm=({initial,onSave,onClose})=>{
    const [f,sF]=useState(initial||{caregiverId:"CG1",clientId:"CL1",date:selDay,startTime:"08:00",endTime:"14:00",tasks:[],notes:"",status:"draft",color:"#3c4f3d"});
    const [taskInput,setTaskInput]=useState("");
    const [showPresets,setShowPresets]=useState(false);
    const hrs=(timeToMin(f.endTime)-timeToMin(f.startTime))/60;
    const addTask=()=>{if(taskInput.trim()){sF(p=>({...p,tasks:[...p.tasks,taskInput.trim()]}));setTaskInput("");}};
    const cgColors={"CG1":"#3c4f3d","CG2":"#4a3f5c","CG3":"#8a7356","CG4":"#3f4749"};

    return <div className="modal-bg" onClick={onClose}><div className="modal" style={{maxWidth:600}} onClick={e=>e.stopPropagation()}>
      <div className="modal-h">{initial?"Edit Shift":"Create Shift"}<button className="btn btn-sm btn-s" onClick={onClose}>✕</button></div>
      <div className="modal-b">
        <div className="fg" style={{marginBottom:14}}>
          <div className="fi"><label>Caregiver</label><select value={f.caregiverId} onChange={e=>sF(p=>({...p,caregiverId:e.target.value,color:cgColors[e.target.value]||"#3c4f3d"}))}>{caregivers.map(c=> <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
          <div className="fi"><label>Client</label><select value={f.clientId} onChange={e=>sF(p=>({...p,clientId:e.target.value}))}>{clients.map(c=> <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
        </div>
        <div className="fg" style={{marginBottom:14}}>
          <div className="fi"><label>Date</label><input type="date" value={f.date} onChange={e=>sF(p=>({...p,date:e.target.value}))}/></div>
          <div className="fi"><label>Start</label><input type="time" value={f.startTime} onChange={e=>sF(p=>({...p,startTime:e.target.value}))}/></div>
          <div className="fi"><label>End</label><input type="time" value={f.endTime} onChange={e=>sF(p=>({...p,endTime:e.target.value}))}/></div>
        </div>
        {hrs>0&& <div style={{textAlign:"center",padding:6,background:"var(--bg)",marginBottom:14,fontSize:13,fontWeight:600}}>{hrs.toFixed(1)} hours</div>}

        <div className="fi" style={{marginBottom:14}}>
          <label style={{display:"flex",justifyContent:"space-between"}}><span>Tasks ({f.tasks.length})</span><span style={{cursor:"pointer",color:"#8a7356"}} onClick={()=>setShowPresets(!showPresets)}>+ Presets</span></label>
          {showPresets&& <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:6,marginBottom:8}}>
            {Object.entries(TASK_PRESETS).map(([k,v])=> <button key={k} className="btn btn-sm btn-s" onClick={()=>{sF(p=>({...p,tasks:[...p.tasks,...v]}));setShowPresets(false);}}>{k} ({v.length})</button>)}
          </div>}
          {f.tasks.map((t,i)=> <div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"5px 0",borderBottom:"var(--border-thin)",fontSize:12}}>
            <span style={{flex:1}}>{t}</span><button style={{background:"none",border:"none",cursor:"pointer",color:"var(--err)",fontSize:14}} onClick={()=>sF(p=>({...p,tasks:p.tasks.filter((_,j)=>j!==i)}))}>✕</button>
          </div>)}
          <div style={{display:"flex",gap:6,marginTop:8}}>
            <input value={taskInput} onChange={e=>setTaskInput(e.target.value)} placeholder="Add task..." style={{flex:1,padding:"8px 10px",border:"var(--border-thin)",fontSize:12}} onKeyDown={e=>e.key==="Enter"&&addTask()}/>
            <button className="btn btn-sm btn-p" onClick={addTask} disabled={!taskInput.trim()}>+</button>
          </div>
        </div>

        <div className="fi" style={{marginBottom:14}}><label>Notes</label><textarea rows={2} value={f.notes} onChange={e=>sF(p=>({...p,notes:e.target.value}))} placeholder="Special instructions..."/></div>

        <div className="fi" style={{marginBottom:14}}><label>Status</label>
          <div style={{display:"flex",gap:8}}>
            {["draft","published"].map(st=> <div key={st} onClick={()=>sF(p=>({...p,status:st}))} style={{flex:1,padding:10,border:`1.5px solid ${f.status===st?"var(--black)":"var(--bdr)"}`,background:f.status===st?"var(--black)":"var(--card)",color:f.status===st?"#fff":"var(--text)",textAlign:"center",fontSize:12,fontWeight:600,cursor:"pointer"}}>{st==="draft"?"📝 Draft":"✅ Published"}</div>)}
          </div>
        </div>

        <button className="btn btn-p" style={{width:"100%"}} onClick={()=>onSave(f)} disabled={hrs<=0}>Save Shift</button>
      </div>
    </div></div>;
  };

  return <div>
    <div className="hdr"><div><h2>Scheduling</h2><div className="hdr-sub">Create, manage, and publish shifts</div></div>
      <button className="btn btn-p btn-sm" onClick={()=>{setShowCreate(true);setEditShift(null);}}>+ Create Shift</button>
    </div>

    {/* Week Stats */}
    <div className="sg" style={{gridTemplateColumns:"repeat(4,1fr)"}}>
      <div className="sc ok"><span className="sl">Shifts</span><span className="sv">{weekScheds.length}</span></div>
      <div className="sc bl"><span className="sl">Hours</span><span className="sv">{weekHrs.toFixed(0)}</span></div>
      <div className="sc" style={{position:"relative"}}><span className="sl" style={{color:drafts.length>0?"#8a7356":"var(--t2)"}}>Drafts</span><span className="sv" style={{color:drafts.length>0?"#8a7356":"inherit"}}>{drafts.length}</span>{drafts.length>0&& <div style={{position:"absolute",left:0,top:0,bottom:0,width:3,background:"#8a7356"}}/>}</div>
      <div className="sc"><span className="sl">Staff</span><span className="sv">{new Set(weekScheds.map(s=>s.caregiverId)).size}</span></div>
    </div>

    {/* Publish Bar */}
    {drafts.length>0&& <div className="publish-bar">
      <div><div className="pb-text">{drafts.length} unpublished draft{drafts.length>1?"s":""}</div><div className="pb-sub">Caregivers can't see drafts</div></div>
      <button className="btn btn-sm" style={{background:"#fff",color:"#000",border:"none"}} onClick={()=>setShowPublish(true)}>Publish</button>
    </div>}

    {/* Week Nav */}
    <div className="week-nav">
      <button onClick={()=>setWeekStart(addDays(weekStart,-7))}>←</button>
      <div className="wn-center" onClick={goToday}><div className="wn-label">{fmtShort(weekStart)} — {fmtShort(weekEnd)}</div><div className="wn-sub">Tap for today</div></div>
      <button onClick={()=>setWeekStart(addDays(weekStart,7))}>→</button>
    </div>

    {/* Day Columns */}
    <div className="day-cols">
      {weekDates.map((d,i)=>{const iso=toISO(d);const daySch=schedules.filter(s=>s.date===iso);const hasDraft=daySch.some(s=>s.status==="draft");
        return <div key={i} className={`day-col ${iso===selDay?"sel":""} ${iso===toISO(now())?"is-today":""}`} onClick={()=>setSelDay(iso)}>
          <div className="dc-day">{DAYS[i]}</div>
          <div className="dc-num">{d.getDate()}</div>
          <div className="dc-dots">{daySch.slice(0,4).map((s,j)=> <div key={j} className="dc-dot" style={{background:iso===selDay?"rgba(255,255,255,.6)":s.status==="draft"?"#8a7356":(s.color||"#3c4f3d")}}/>)}</div>
        </div>;
      })}
    </div>

    {/* Filter & Actions */}
    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12,flexWrap:"wrap"}}>
      <select value={filterCG} onChange={e=>setFilterCG(e.target.value)} style={{padding:"6px 10px",border:"var(--border-thin)",fontSize:11,fontFamily:"var(--f)",fontWeight:600}}>
        <option value="">All Caregivers</option>{caregivers.map(c=> <option key={c.id} value={c.id}>{c.name}</option>)}
      </select>
      <div style={{flex:1}}/>
      <button className="btn btn-sm btn-s" onClick={()=>setShowCopy(true)}>Copy Week</button>
      {dayScheds.some(s=>s.status==="draft")&& <button className="btn btn-sm btn-ok" onClick={publishDay}>Publish Day</button>}
    </div>

    {/* Conflicts */}
    {conflicts.length>0&& <div className="conflict-warn">⚠️ {conflicts.length} overlapping shift{conflicts.length>1?"s":""} detected for same caregiver</div>}

    {/* Day Header */}
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
      <div style={{fontWeight:600,fontSize:14}}>{fromISO(selDay).toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric"})}{selDay===toISO(now())&&<span style={{color:"#3c4f3d",marginLeft:6,fontSize:11}}>TODAY</span>}</div>
      <div style={{fontSize:12,color:"var(--t2)"}}>{dayScheds.length} shift{dayScheds.length!==1?"s":""}</div>
    </div>

    {/* Shift Blocks */}
    {dayScheds.length===0&& <div className="card card-b empty">No shifts. <button className="btn btn-sm btn-p" style={{marginTop:8}} onClick={()=>{setShowCreate(true);setEditShift(null);}}>+ Create</button></div>}
    {dayScheds.sort((a,b)=>a.startTime.localeCompare(b.startTime)).map(s=>{const cl=clients.find(c=>c.id===s.clientId);const cg=caregivers.find(c=>c.id===s.caregiverId);const hrs=((timeToMin(s.endTime)-timeToMin(s.startTime))/60).toFixed(1);const isDraft=s.status==="draft";const hasConflict=conflicts.some(c=>c.id===s.id);
      return <div key={s.id} className="shift-block" style={{background:isDraft?"rgba(138,115,86,.05)":"var(--card)",borderColor:hasConflict?"var(--err)":"var(--bdr)"}} onClick={()=>setEditShift(s)}>
        <div style={{position:"absolute",left:0,top:0,bottom:0,width:4,background:isDraft?"#8a7356":(s.color||"#3c4f3d")}}/>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
          <div style={{paddingLeft:10}}>
            <div style={{fontSize:14,fontWeight:600}}>{s.startTime} — {s.endTime} <span style={{fontWeight:400,color:"var(--t2)",fontSize:12}}>({hrs}h)</span></div>
            <div style={{fontFamily:"var(--fd)",fontSize:16,fontWeight:400,marginTop:2}}>{cl?.name}</div>
            <div style={{fontSize:11,color:"var(--t2)",marginTop:2,display:"flex",alignItems:"center",gap:6}}>
              <span style={{width:8,height:8,borderRadius:"50%",background:s.color||"#3c4f3d",display:"inline-block",flexShrink:0}}/>{cg?.name} | {s.tasks.length} tasks
            </div>
            {s.notes&& <div style={{fontSize:11,color:"#8a7356",marginTop:3}}>📝 {s.notes}</div>}
          </div>
          <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:4}}>
            <span className={`tag ${isDraft?"tag-wn":"tag-ok"}`}>{isDraft?"DRAFT":"PUBLISHED"}</span>
            {hasConflict&& <span className="tag tag-er">CONFLICT</span>}
          </div>
        </div>
      </div>;
    })}

    {dayScheds.length>0&& <div style={{marginTop:8}}><button className="btn btn-s" style={{width:"100%"}} onClick={()=>{setShowCreate(true);setEditShift(null);}}>+ Add shift on {fromISO(selDay).toLocaleDateString("en-US",{weekday:"long"})}</button></div>}

    {/* ── EDIT DETAIL MODAL ── */}
    {editShift&&!showCreate&& <div className="modal-bg" onClick={()=>setEditShift(null)}><div className="modal" onClick={e=>e.stopPropagation()}>
      <div className="modal-h">Shift Detail<button className="btn btn-sm btn-s" onClick={()=>setEditShift(null)}>✕</button></div>
      <div className="modal-b">
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
          <div style={{padding:12,background:"var(--bg)"}}><div style={{fontSize:9,color:"var(--t2)",textTransform:"uppercase",fontWeight:600}}>Client</div><div style={{fontWeight:700,fontSize:14}}>{clients.find(c=>c.id===editShift.clientId)?.name}</div></div>
          <div style={{padding:12,background:"var(--bg)"}}><div style={{fontSize:9,color:"var(--t2)",textTransform:"uppercase",fontWeight:600}}>Caregiver</div><div style={{fontWeight:700,fontSize:14}}>{caregivers.find(c=>c.id===editShift.caregiverId)?.name}</div></div>
          <div style={{padding:12,background:"var(--bg)"}}><div style={{fontSize:9,color:"var(--t2)",textTransform:"uppercase",fontWeight:600}}>Time</div><div style={{fontWeight:700,fontSize:14}}>{editShift.startTime} — {editShift.endTime}</div></div>
          <div style={{padding:12,background:"var(--bg)"}}><div style={{fontSize:9,color:"var(--t2)",textTransform:"uppercase",fontWeight:600}}>Status</div><span className={`tag ${editShift.status==="draft"?"tag-wn":"tag-ok"}`}>{editShift.status}</span></div>
        </div>
        {editShift.tasks.length>0&& <div style={{marginBottom:14}}><div style={{fontSize:10,fontWeight:700,textTransform:"uppercase",color:"var(--t2)",letterSpacing:.5,marginBottom:6}}>Tasks</div>{editShift.tasks.map((t,i)=> <div key={i} style={{padding:"5px 0",borderBottom:"var(--border-thin)",fontSize:12}}>• {t}</div>)}</div>}
        {editShift.notes&& <div style={{padding:10,background:"rgba(138,115,86,.08)",fontSize:12,marginBottom:14}}>📝 {editShift.notes}</div>}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:8}}>
          <button className="btn btn-p" onClick={()=>setShowCreate(true)}>Edit</button>
          <button className="btn btn-s" onClick={()=>{duplicateShift(editShift);setEditShift(null);}}>Duplicate</button>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
          {editShift.status==="draft"? <button className="btn btn-ok" onClick={()=>{setSchedules(p=>p.map(s=>s.id===editShift.id?{...s,status:"published"}:s));setEditShift(null);}}>Publish</button>
          : <button className="btn btn-s" onClick={()=>{setSchedules(p=>p.map(s=>s.id===editShift.id?{...s,status:"draft"}:s));setEditShift(null);}}>Unpublish</button>}
          <button className="btn btn-er" onClick={()=>{deleteShift(editShift.id);setEditShift(null);}}>Delete</button>
        </div>
      </div>
    </div></div>}

    {/* ── CREATE/EDIT FORM ── */}
    {showCreate&& <ShiftForm initial={editShift} onSave={saveShift} onClose={()=>{setShowCreate(false);setEditShift(null);}}/>}

    {/* ── PUBLISH WEEK MODAL ── */}
    {showPublish&& <div className="modal-bg" onClick={()=>setShowPublish(false)}><div className="modal" onClick={e=>e.stopPropagation()}>
      <div className="modal-h">Publish Week<button className="btn btn-sm btn-s" onClick={()=>setShowPublish(false)}>✕</button></div>
      <div className="modal-b">
        <div style={{padding:14,background:"var(--bg)",marginBottom:14}}>
          <div style={{fontWeight:700,marginBottom:8}}>{fmtShort(weekStart)} — {fmtShort(weekEnd)}</div>
          <div style={{fontSize:12,color:"var(--t2)"}}>{weekScheds.length} total shifts | {drafts.length} drafts to publish | {weekScheds.length-drafts.length} already published</div>
        </div>
        <p style={{fontSize:12,color:"var(--t2)",marginBottom:14}}>Publishing makes all {drafts.length} draft{drafts.length>1?"s":""} visible to caregivers immediately.</p>
        <button className="btn btn-p" style={{width:"100%"}} onClick={publishWeek}>Publish {drafts.length} Shift{drafts.length>1?"s":""}</button>
      </div>
    </div></div>}

    {/* ── COPY WEEK MODAL ── */}
    {showCopy&& <div className="modal-bg" onClick={()=>setShowCopy(false)}><div className="modal" onClick={e=>e.stopPropagation()}>
      <div className="modal-h">Copy Week<button className="btn btn-sm btn-s" onClick={()=>setShowCopy(false)}>✕</button></div>
      <div className="modal-b">
        <p style={{fontSize:12,color:"var(--t2)",marginBottom:14}}>Copy {weekScheds.length} shifts from {fmtShort(weekStart)} — {fmtShort(weekEnd)} as drafts:</p>
        {[1,2,3,4].map(w=>{const t=addDays(weekStart,w*7);const te=addDays(t,6);const exist=schedules.filter(s=>s.date>=toISO(t)&&s.date<=toISO(te)).length;
          return <button key={w} className="btn btn-s" style={{width:"100%",justifyContent:"space-between",padding:14,marginBottom:6}} onClick={()=>copyWeekTo(t)}>
            <span style={{fontWeight:600}}>{fmtShort(t)} — {fmtShort(te)}</span>
            {exist>0&&<span style={{fontSize:11,color:"#8a7356"}}>{exist} shifts exist</span>}
          </button>;
        })}
      </div>
    </div></div>}
  </div>;
}

// ═══════════════════════════════════════════════════════════════════════
// DASHBOARD
// ═══════════════════════════════════════════════════════════════════════
function DashPage({clients,caregivers,incidents,expenses,careNotes,events,trainingProgress,setPg}){
  const openInc=incidents.filter(i=>i.status==="open").length;
  const pendExp=expenses.filter(e=>e.status==="pending");
  const recentNotes=careNotes.sort((a,b)=>new Date(b.date)-new Date(a.date)).slice(0,4);
  const upcoming=events.filter(e=>new Date(e.date)>=now()).sort((a,b)=>new Date(a.date)-new Date(b.date)).slice(0,3);
  const avgTraining=Math.round(Object.values(trainingProgress).reduce((s,p)=>s+p.length,0)/Object.keys(trainingProgress).length/TRAINING_MODULES.length*100);

  return <div>
    <div className="hdr"><div><h2>Command Center</h2><div className="hdr-sub">{new Date().toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric",year:"numeric"})}</div></div></div>

    <div className="sg">
      <div className="sc bl"><span className="sl">Active Clients</span><span className="sv">{clients.filter(c=>c.status==="active").length}</span><span className="ss">{clients.length} total</span></div>
      <div className="sc ok"><span className="sl">Caregivers</span><span className="sv">{caregivers.filter(c=>c.status==="active").length}</span><span className="ss">All active</span></div>
      <div className="sc" style={{borderColor:openInc>0?"var(--err)":"var(--ok)"}}><span className="sl">Open Incidents</span><span className="sv">{openInc}</span><span className="ss">{incidents.length} total reported</span></div>
      <div className="sc wn"><span className="sl">Pending Expenses</span><span className="sv">{$(pendExp.reduce((s,e)=>s+e.amount,0))}</span><span className="ss">{pendExp.length} awaiting</span></div>
      <div className="sc pu"><span className="sl">Training Avg</span><span className="sv">{avgTraining}%</span><span className="ss">{TRAINING_MODULES.length} modules</span></div>
    </div>

    {/* AI Insights */}
    <div className="ai-card">
      <h4><span className="pulse" style={{background:"var(--ok)"}}/>CWIN AI Insights</h4>
      <p>
        {openInc>0&&`⚠️ ${openInc} open incident${openInc>1?"s":""} need attention. `}
        {pendExp.length>0&&`💰 ${pendExp.length} expense${pendExp.length>1?"s":""} (${$(pendExp.reduce((s,e)=>s+e.amount,0))}) pending approval. `}
        {upcoming.length>0&&`📅 Next event: ${upcoming[0].title} on ${fmtD(upcoming[0].date)}. `}
        {avgTraining<75&&`🎓 Team training at ${avgTraining}% completion — consider scheduling a training day. `}
        Linda Frank's risk level is medium due to CHF and fall history — recommend increased visit frequency.
        Steven Brown missed a Parkinson's medication dose this week — pill organizer audit recommended.
      </p>
    </div>

    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
      {/* Recent Care Notes */}
      <div className="card">
        <div className="card-h"><h3>Recent Care Notes</h3><button className="btn btn-sm btn-s" onClick={()=>setPg("care")}>View All</button></div>
        {recentNotes.map(n=>{const cl=CLIENTS.find(c=>c.id===n.clientId);const cg=CAREGIVERS.find(c=>c.id===n.caregiverId);
          return <div key={n.id} style={{padding:"10px 18px",borderBottom:"1px solid var(--bdr)"}}>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:"var(--t2)",marginBottom:4}}><span>{cg?.name} → {cl?.name}</span><span>{fmtRel(n.date)}</span></div>
            <div style={{fontSize:12.5,lineHeight:1.5}}>{n.text.slice(0,120)}{n.text.length>120?"...":""}</div>
          </div>;})}
      </div>

      {/* Upcoming Events */}
      <div className="card">
        <div className="card-h"><h3>Upcoming Events</h3><button className="btn btn-sm btn-s" onClick={()=>setPg("events")}>View All</button></div>
        {upcoming.map(ev=>{const cl=CLIENTS.find(c=>c.id===ev.clientId);
          return <div key={ev.id} style={{padding:"10px 18px",borderBottom:"1px solid var(--bdr)"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div><div style={{fontWeight:600,fontSize:13}}>{ev.title}</div><div style={{fontSize:11,color:"var(--t2)"}}>{cl?.name} • {fmtD(ev.date)}</div></div>
              <span className={`tag ${ev.type==="medical"?"tag-er":"tag-bl"}`}>{ev.type}</span>
            </div>
          </div>;})}
        {upcoming.length===0&&<div className="empty">No upcoming events</div>}
      </div>
    </div>
  </div>;
}

// ═══════════════════════════════════════════════════════════════════════
// CLIENT PROFILES
// ═══════════════════════════════════════════════════════════════════════
function ClientsPage({clients,setClients,sel,setSel,caregivers,careNotes,incidents,events,chores,expenses,schedules}){
  const cl=clients.find(c=>c.id===sel)||clients[0];
  const [tab,setTab]=useState("overview");
  const [editField,setEditField]=useState(null);
  const [addInput,setAddInput]=useState("");
  const [editADL,setEditADL]=useState(null);
  const [editPref,setEditPref]=useState(null);
  const [editSocial,setEditSocial]=useState(null);
  const [editEmergency,setEditEmergency]=useState(null);
  const [calMonth,setCalMonth]=useState(now().getMonth());
  const [calYear,setCalYear]=useState(now().getFullYear());

  const clNotes=careNotes.filter(n=>n.clientId===cl.id).sort((a,b)=>new Date(b.date)-new Date(a.date));
  const clInc=incidents.filter(i=>i.clientId===cl.id);
  const clEvents=events.filter(e=>e.clientId===cl.id);
  const clChores=chores.filter(c=>c.clientId===cl.id);
  const clExp=expenses.filter(e=>e.clientId===cl.id);
  const clSchedules=(schedules||[]).filter(s=>s.clientId===cl.id);

  // ── UPDATE HELPERS ──
  const updateClient=(field,value)=>setClients(p=>p.map(c=>c.id===cl.id?{...c,[field]:value}:c));
  const addToArray=(field,val)=>{if(!val.trim())return;updateClient(field,[...cl[field],val.trim()]);setAddInput("");};
  const removeFromArray=(field,idx)=>updateClient(field,cl[field].filter((_,i)=>i!==idx));
  const updateNested=(parent,key,val)=>updateClient(parent,{...cl[parent],[key]:val});

  // ── MONTHLY CALENDAR ──
  const daysInMonth=new Date(calYear,calMonth+1,0).getDate();
  const firstDayOfWeek=new Date(calYear,calMonth,1).getDay();
  const calDays=Array.from({length:daysInMonth},(_,i)=>{
    const d=new Date(calYear,calMonth,i+1);
    const iso=toISO(d);
    const dayScheds=clSchedules.filter(s=>s.date===iso);
    const dayNotes=careNotes.filter(n=>n.clientId===cl.id&&n.date&&n.date.startsWith(iso));
    const dayEvents=events.filter(e=>e.clientId===cl.id&&e.date&&e.date.startsWith(iso));
    const isToday=iso===toISO(now());
    return{date:d,iso,day:i+1,dow:d.getDay(),scheds:dayScheds,notes:dayNotes,events:dayEvents,isToday};
  });
  const blanks=Array.from({length:firstDayOfWeek===0?6:(firstDayOfWeek-1)});

  // ── GAP ANALYSIS ──
  const weekdays=calDays.filter(d=>d.dow!==0&&d.dow!==6);
  const noShiftDays=weekdays.filter(d=>d.scheds.length===0&&new Date(d.iso)>=now());
  const totalWeekdays=weekdays.filter(d=>new Date(d.iso)>=now()).length;
  const coveragePct=totalWeekdays>0?Math.round(((totalWeekdays-noShiftDays.length)/totalWeekdays)*100):100;
  const monthNames=["January","February","March","April","May","June","July","August","September","October","November","December"];

  return <div>
    <div className="hdr"><div><h2>Client Profiles</h2><div className="hdr-sub">Comprehensive health, social, and care data</div></div>
      <select value={sel} onChange={e=>setSel(e.target.value)} style={{padding:"8px 12px",border:"var(--border-thin)",fontFamily:"var(--f)",fontWeight:600}}>
        {clients.map(c=> <option key={c.id} value={c.id}>{c.name}</option>)}
      </select>
    </div>

    {/* Client Header */}
    <div className="card card-b" style={{display:"flex",gap:20,alignItems:"center",flexWrap:"wrap"}}>
      <div className="avatar" style={{width:56,height:56,fontSize:20,background:"#111",color:"#fff"}}>{cl.name.split(" ").map(n=>n[0]).join("")}</div>
      <div style={{flex:1,minWidth:200}}>
        <div style={{fontFamily:"var(--fd)",fontSize:20,fontWeight:400}}>{cl.name}</div>
        <div style={{fontSize:12,color:"var(--t2)"}}>{cl.age} years old | {cl.addr}</div>
        <div style={{display:"flex",gap:6,marginTop:6,flexWrap:"wrap"}}>
          <span className={`tag tag-${cl.riskLevel==="low"?"ok":cl.riskLevel==="medium"?"wn":"er"}`}>Risk: {cl.riskLevel.toUpperCase()}</span>
          {cl.dx.slice(0,3).map((d,i)=> <span key={i} className="tag tag-bl">{d}</span>)}
          {cl.dx.length>3&& <span className="tag tag-bl">+{cl.dx.length-3}</span>}
        </div>
      </div>
      <div style={{textAlign:"right"}}><div style={{fontSize:10,color:"var(--t2)",textTransform:"uppercase"}}>Bill Rate</div><div style={{fontFamily:"var(--fd)",fontSize:22,fontWeight:400}}>${cl.billRate}/hr</div></div>
    </div>

    <div className="tab-row">
      {["overview","health","social","care","timeline"].map(t=> <button key={t} className={`tab-btn ${tab===t?"act":""}`} onClick={()=>setTab(t)}>{({overview:"📅 Overview",health:"🏥 Health & ADL",social:"🌱 Social",care:"📋 Care Plan",timeline:"📝 Timeline"})[t]}</button>)}
    </div>

    {/* ═══ OVERVIEW — Monthly Calendar + Gap Analysis ═══ */}
    {tab==="overview"&& <div>
      {/* AI Gap Analysis */}
      <div className="ai-card">
        <h4><span className="pulse" style={{background:coveragePct>=80?"#3c4f3d":"#8a7356"}}/>Schedule Coverage — {monthNames[calMonth]} {calYear}</h4>
        <p>
          {coveragePct}% weekday coverage for {cl.name} ({totalWeekdays-noShiftDays.length}/{totalWeekdays} remaining weekdays covered).
          {noShiftDays.length>0?` ⚠️ ${noShiftDays.length} uncovered weekday${noShiftDays.length>1?"s":""}: ${noShiftDays.slice(0,5).map(d=>fromISO(d.iso).toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"})).join(", ")}${noShiftDays.length>5?` and ${noShiftDays.length-5} more`:""}.`:" All upcoming weekdays are covered."}
          {clEvents.filter(e=>new Date(e.date)>=now()).length>0?` ${clEvents.filter(e=>new Date(e.date)>=now()).length} upcoming event${clEvents.filter(e=>new Date(e.date)>=now()).length>1?"s":""} this month.`:""}
          {cl.riskLevel==="medium"?" Recommend reviewing care plan frequency due to medium risk level.":""}
        </p>
      </div>

      {/* Calendar Navigation */}
      <div className="week-nav" style={{marginBottom:12}}>
        <button onClick={()=>{if(calMonth===0){setCalMonth(11);setCalYear(y=>y-1);}else setCalMonth(m=>m-1);}}>←</button>
        <div className="wn-center" onClick={()=>{setCalMonth(now().getMonth());setCalYear(now().getFullYear());}}><div className="wn-label">{monthNames[calMonth]} {calYear}</div><div className="wn-sub">Tap for current month</div></div>
        <button onClick={()=>{if(calMonth===11){setCalMonth(0);setCalYear(y=>y+1);}else setCalMonth(m=>m+1);}}>→</button>
      </div>

      {/* Calendar Grid */}
      <div className="card" style={{overflow:"visible"}}>
        <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",borderBottom:"var(--border-thin)"}}>
          {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map(d=> <div key={d} style={{padding:"8px 4px",textAlign:"center",fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:.5,color:"var(--t2)"}}>{d}</div>)}
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)"}}>
          {blanks.map((_,i)=> <div key={"b"+i} style={{minHeight:72,border:"var(--border-thin)",background:"var(--bg)",opacity:.3}}/>)}
          {calDays.map(d=>{
            const hasGap=d.scheds.length===0&&d.dow!==0&&d.dow!==6&&new Date(d.iso)>=now();
            return <div key={d.day} style={{minHeight:72,border:"var(--border-thin)",padding:"4px 6px",background:d.isToday?"rgba(60,79,61,.08)":hasGap?"rgba(138,115,86,.06)":"var(--card)",position:"relative",cursor:"default"}}>
              <div style={{fontSize:12,fontWeight:d.isToday?700:400,color:d.isToday?"#3c4f3d":d.dow===0||d.dow===6?"var(--t3)":"var(--text)"}}>{d.day}</div>
              {d.scheds.map((s,i)=>{const cg=caregivers?.find(c=>c.id===s.caregiverId);return <div key={i} style={{fontSize:8,padding:"1px 4px",marginTop:2,background:s.color||"#3c4f3d",color:"#fff",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{s.startTime} {cg?.name?.split(" ")[0]||""}</div>;})}
              {d.events.map((e,i)=> <div key={"e"+i} style={{fontSize:8,padding:"1px 4px",marginTop:2,background:e.type==="medical"?"rgba(122,48,48,.15)":"rgba(63,71,73,.1)",color:e.type==="medical"?"var(--err)":"var(--t2)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{e.type==="medical"?"🏥":"🌱"} {e.title?.split(" ")[0]}</div>)}
              {hasGap&& <div style={{fontSize:7,padding:"1px 3px",marginTop:2,background:"rgba(138,115,86,.2)",color:"#8a7356",fontWeight:700,textTransform:"uppercase",letterSpacing:.3}}>Gap</div>}
            </div>;
          })}
        </div>
      </div>

      {/* Legend */}
      <div style={{display:"flex",gap:14,marginTop:10,fontSize:10,color:"var(--t2)",flexWrap:"wrap"}}>
        <span style={{display:"flex",alignItems:"center",gap:4}}><div style={{width:10,height:10,background:"#3c4f3d"}}/> Scheduled shift</span>
        <span style={{display:"flex",alignItems:"center",gap:4}}><div style={{width:10,height:10,background:"rgba(122,48,48,.15)",border:"1px solid rgba(122,48,48,.3)"}}/> Medical event</span>
        <span style={{display:"flex",alignItems:"center",gap:4}}><div style={{width:10,height:10,background:"rgba(138,115,86,.2)",border:"1px solid rgba(138,115,86,.3)"}}/> Coverage gap</span>
        <span style={{display:"flex",alignItems:"center",gap:4}}><div style={{width:10,height:10,background:"rgba(60,79,61,.08)",border:"1px solid rgba(60,79,61,.2)"}}/> Today</span>
      </div>

      {/* Quick Stats */}
      <div className="sg" style={{marginTop:16}}>
        <div className="sc ok"><span className="sl">Coverage</span><span className="sv">{coveragePct}%</span><span className="ss">weekday coverage</span></div>
        <div className="sc bl"><span className="sl">Shifts</span><span className="sv">{clSchedules.filter(s=>s.date&&s.date.startsWith(`${calYear}-${String(calMonth+1).padStart(2,"0")}`)).length}</span><span className="ss">this month</span></div>
        <div className="sc" style={{position:"relative"}}>{noShiftDays.length>0&&<div style={{position:"absolute",left:0,top:0,bottom:0,width:3,background:"#8a7356"}}/>}<span className="sl">Gaps</span><span className="sv" style={{color:noShiftDays.length>0?"#8a7356":"var(--text)"}}>{noShiftDays.length}</span><span className="ss">uncovered days</span></div>
        <div className="sc"><span className="sl">Notes</span><span className="sv">{clNotes.length}</span><span className="ss">care notes</span></div>
      </div>
    </div>}

    {/* ═══ HEALTH — Editable ═══ */}
    {tab==="health"&& <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
      {/* Diagnoses — Editable */}
      <div className="card">
        <div className="card-h"><h3>Diagnoses</h3><button className="btn btn-sm btn-s" onClick={()=>setEditField(editField==="dx"?null:"dx")}>{editField==="dx"?"Done":"Edit"}</button></div>
        <div className="card-b">
          {cl.dx.map((d,i)=> <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"6px 0",borderBottom:i<cl.dx.length-1?"var(--border-thin)":""}}>
            <span style={{fontSize:13,fontWeight:600}}>{d}</span>
            {editField==="dx"&& <button style={{background:"none",border:"none",color:"var(--err)",cursor:"pointer",fontSize:14}} onClick={()=>removeFromArray("dx",i)}>✕</button>}
          </div>)}
          {editField==="dx"&& <TypeaheadInput list={DX_LIST} placeholder="Search diagnoses..." existing={cl.dx} onSelect={val=>addToArray("dx",val)}/>}
        </div>
      </div>

      {/* Medications — Editable */}
      <div className="card">
        <div className="card-h"><h3>Medications</h3><button className="btn btn-sm btn-s" onClick={()=>setEditField(editField==="meds"?null:"meds")}>{editField==="meds"?"Done":"Edit"}</button></div>
        <div className="card-b">
          {cl.meds.map((m,i)=> <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"6px 0",borderBottom:i<cl.meds.length-1?"var(--border-thin)":""}}>
            <span style={{fontSize:13}}>{m}</span>
            {editField==="meds"&& <button style={{background:"none",border:"none",color:"var(--err)",cursor:"pointer",fontSize:14}} onClick={()=>removeFromArray("meds",i)}>✕</button>}
          </div>)}
          {editField==="meds"&& <TypeaheadInput list={MED_LIST} placeholder="Search medications..." existing={cl.meds} onSelect={val=>addToArray("meds",val)}/>}
        </div>
      </div>

      {/* ADL — Editable */}
      <div className="card" style={{gridColumn:"span 2"}}>
        <div className="card-h"><h3>ADL Status (8 Categories)</h3><button className="btn btn-sm btn-s" onClick={()=>setEditADL(editADL?null:{...cl.adl})}>{editADL?"Cancel":"Edit"}</button></div>
        <div className="card-b">
          {editADL? <div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))",gap:12,marginBottom:12}}>
              {Object.entries(editADL).map(([k,v])=>{const opts=ADL_OPTIONS[k]||[];return <div key={k} className="fi"><label>{k}</label><select value={v} onChange={e=>setEditADL(p=>({...p,[k]:e.target.value}))}>
                <option value="">Select level...</option>
                {opts.map(o=> <option key={o} value={o}>{o}</option>)}
              </select></div>;})}
            </div>
            <button className="btn btn-sm btn-p" onClick={()=>{updateClient("adl",editADL);setEditADL(null);}}>Save ADL</button>
          </div>
          : <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:10}}>
            {Object.entries(cl.adl).map(([k,v])=>{const short=v.split(" — ")[0];const desc=v.split(" — ")[1]||"";const isIndep=v.startsWith("Independent")||v.startsWith("Continent")||v.startsWith("Intact");const isDep=v.includes("Total dependence")||v.includes("Bedbound")||v.includes("Severe");const isMod=v.includes("Moderate")||v.includes("Maximum")||v.includes("Fall risk");
              return <div key={k} style={{padding:10,border:"var(--border-thin)",background:isDep?"var(--err-l)":isMod?"var(--warn-l)":isIndep?"var(--ok-l)":"var(--bg)"}}>
                <div style={{fontSize:9,textTransform:"uppercase",letterSpacing:.6,color:"var(--t2)",fontWeight:700,marginBottom:4}}>{k}</div>
                <div style={{fontSize:12,fontWeight:600,color:isDep?"var(--err)":isMod?"#8a7356":"var(--text)"}}>{short}</div>
                {desc&& <div style={{fontSize:10,color:"var(--t2)",marginTop:2,lineHeight:1.4}}>{desc}</div>}
              </div>;
            })}
          </div>}
        </div>
      </div>

      {/* Emergency Contact — Editable */}
      <div className="card">
        <div className="card-h"><h3>Emergency Contact</h3><button className="btn btn-sm btn-s" onClick={()=>setEditEmergency(editEmergency?null:{val:cl.emergency,phone:cl.phone})}>{editEmergency?"Cancel":"Edit"}</button></div>
        <div className="card-b">{editEmergency? <div>
          <div className="fi" style={{marginBottom:8}}><label>Contact</label><input value={editEmergency.val} onChange={e=>setEditEmergency(p=>({...p,val:e.target.value}))}/></div>
          <div className="fi" style={{marginBottom:8}}><label>Phone</label><input value={editEmergency.phone} onChange={e=>setEditEmergency(p=>({...p,phone:e.target.value}))}/></div>
          <button className="btn btn-sm btn-p" onClick={()=>{updateClient("emergency",editEmergency.val);updateClient("phone",editEmergency.phone);setEditEmergency(null);}}>Save</button>
        </div>:<div><div style={{fontSize:14,fontWeight:600}}>{cl.emergency}</div><div style={{fontSize:12,color:"var(--t2)",marginTop:2}}>{cl.phone}</div></div>}</div>
      </div>

      {/* Risk Level — Editable */}
      <div className="card">
        <div className="card-h"><h3>Risk Level & Billing</h3></div>
        <div className="card-b">
          <div className="fi" style={{marginBottom:10}}><label>Risk Level</label>
            <div style={{display:"flex",gap:6}}>{["low","medium","high"].map(r=> <div key={r} onClick={()=>updateClient("riskLevel",r)} style={{flex:1,padding:10,textAlign:"center",border:`1.5px solid ${cl.riskLevel===r?"var(--black)":"var(--bdr)"}`,background:cl.riskLevel===r?"var(--black)":"var(--card)",color:cl.riskLevel===r?"#fff":"var(--text)",fontSize:12,fontWeight:600,cursor:"pointer",textTransform:"uppercase"}}>{r}</div>)}</div>
          </div>
          <div className="fi"><label>Bill Rate ($/hr)</label><input type="number" value={cl.billRate} onChange={e=>updateClient("billRate",+e.target.value)} step="0.5" style={{fontWeight:700}}/></div>
        </div>
      </div>

      {/* Incidents */}
      <div className="card" style={{gridColumn:"span 2"}}><div className="card-h"><h3>Incidents ({clInc.length})</h3></div><div className="card-b">{clInc.length===0? <div className="empty">No incidents</div>:clInc.slice(0,3).map(inc=> <div key={inc.id} style={{padding:"6px 0",borderBottom:"var(--border-thin)",fontSize:12}}><span className={`tag ${inc.severity==="low"?"tag-wn":"tag-er"}`} style={{marginRight:6}}>{inc.type}</span>{inc.description.slice(0,80)}...</div>)}</div></div>

      {/* AI Clinical Agent */}
      <div style={{gridColumn:"span 2"}}><ClinicalAgent cl={cl} incidents={incidents} careNotes={careNotes}/></div>
    </div>}

    {/* ═══ SOCIAL — Editable ═══ */}
    {tab==="social"&& <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
      {/* Interests — Editable */}
      <div className="card">
        <div className="card-h"><h3>Interests & Hobbies</h3><button className="btn btn-sm btn-s" onClick={()=>setEditField(editField==="interests"?null:"interests")}>{editField==="interests"?"Done":"Edit"}</button></div>
        <div className="card-b">
          <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
            {cl.social.interests.map((int,i)=> <span key={i} className="tag tag-bl" style={{cursor:editField==="interests"?"pointer":"default"}} onClick={()=>editField==="interests"&&updateNested("social","interests",cl.social.interests.filter((_,j)=>j!==i))}>{int}{editField==="interests"?" ✕":""}</span>)}
          </div>
          {editField==="interests"&& <TypeaheadInput list={INTERESTS_LIST} placeholder="Search interests & hobbies..." existing={cl.social.interests} onSelect={val=>updateNested("social","interests",[...cl.social.interests,val])}/>}
        </div>
      </div>

      {/* Personal Details — Editable */}
      <div className="card">
        <div className="card-h"><h3>Personal Details</h3><button className="btn btn-sm btn-s" onClick={()=>setEditSocial(editSocial?null:{...cl.social})}>{editSocial?"Cancel":"Edit"}</button></div>
        <div className="card-b">{editSocial? <div>
          <div className="fi" style={{marginBottom:8}}><label>Faith</label><input value={editSocial.faith} onChange={e=>setEditSocial(p=>({...p,faith:e.target.value}))}/></div>
          <div className="fi" style={{marginBottom:8}}><label>Pets</label><input value={editSocial.pets} onChange={e=>setEditSocial(p=>({...p,pets:e.target.value}))}/></div>
          <div className="fi" style={{marginBottom:8}}><label>Birthday</label><input type="date" value={editSocial.birthday} onChange={e=>setEditSocial(p=>({...p,birthday:e.target.value}))}/></div>
          <button className="btn btn-sm btn-p" onClick={()=>{updateClient("social",editSocial);setEditSocial(null);}}>Save</button>
        </div>:<div style={{fontSize:13,lineHeight:2}}>
          <div><strong>Faith:</strong> {cl.social.faith}</div>
          <div><strong>Pets:</strong> {cl.social.pets||"None"}</div>
          <div><strong>Birthday:</strong> {fmtD(cl.social.birthday)}</div>
        </div>}</div>
      </div>

      {/* Preferences — Editable */}
      <div className="card" style={{gridColumn:"span 2"}}>
        <div className="card-h"><h3>Daily Preferences</h3><button className="btn btn-sm btn-s" onClick={()=>setEditPref(editPref?null:{...cl.preferences})}>{editPref?"Cancel":"Edit"}</button></div>
        <div className="card-b">{editPref? <div>
          <div className="fg" style={{gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",marginBottom:12}}>
            {Object.entries(editPref).map(([k,v])=> <div key={k} className="fi"><label>{k.replace(/([A-Z])/g," $1")}</label><input value={Array.isArray(v)?v.join(", "):v} onChange={e=>setEditPref(p=>({...p,[k]:k==="tvShows"?e.target.value.split(",").map(s=>s.trim()):e.target.value}))}/></div>)}
          </div>
          <button className="btn btn-sm btn-p" onClick={()=>{updateClient("preferences",editPref);setEditPref(null);}}>Save Preferences</button>
        </div>:<div className="fg" style={{gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))"}}>
          {Object.entries(cl.preferences).map(([k,v])=> <div key={k}><div style={{fontSize:10,textTransform:"uppercase",color:"var(--t2)",fontWeight:600,marginBottom:3}}>{k.replace(/([A-Z])/g," $1")}</div><div style={{fontSize:13,fontWeight:600}}>{Array.isArray(v)?v.join(", "):v}</div></div>)}
        </div>}</div>
      </div>

      {/* AI Social Agent */}
      <div style={{gridColumn:"span 2"}}><SocialAgent cl={cl}/></div>
    </div>}

    {/* ═══ CARE ═══ */}
    {tab==="care"&& <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
      <div className="card"><div className="card-h"><h3>Active Chores & Tasks</h3></div>
        {clChores.map(ch=> <div key={ch.id} style={{padding:"10px 18px",borderBottom:"var(--border-thin)",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div><div style={{fontWeight:600,fontSize:13}}>{ch.title}</div><div style={{fontSize:11,color:"var(--t2)"}}>{ch.frequency} | Last: {fmtD(ch.lastDone)}</div></div>
          <span className={`tag ${ch.priority==="high"?"tag-er":"tag-ok"}`}>{ch.priority}</span>
        </div>)}
        {clChores.length===0&& <div className="empty">No active tasks</div>}
      </div>
      <div className="card"><div className="card-h"><h3>Expenses This Period</h3></div>
        {clExp.length===0? <div className="empty">No expenses</div>:clExp.map(ex=> <div key={ex.id} style={{padding:"10px 18px",borderBottom:"var(--border-thin)",display:"flex",justifyContent:"space-between"}}>
          <div><div style={{fontWeight:600,fontSize:13}}>{ex.description}</div><div style={{fontSize:11,color:"var(--t2)"}}>{ex.category} | {fmtD(ex.date)}</div></div>
          <div style={{textAlign:"right"}}><div style={{fontWeight:700}}>{$(ex.amount)}</div><span className={`tag ${ex.status==="approved"?"tag-ok":"tag-wn"}`}>{ex.status}</span></div>
        </div>)}
      </div>
    </div>}

    {/* ═══ TIMELINE ═══ */}
    {tab==="timeline"&& <div className="card"><div className="card-h"><h3>Care Timeline</h3></div>
      {clNotes.map(n=>{const cg=(caregivers||CAREGIVERS).find(c=>c.id===n.caregiverId);return <div key={n.id} style={{padding:"12px 18px",borderBottom:"var(--border-thin)"}}>
        <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:"var(--t2)",marginBottom:4}}>
          <span style={{fontWeight:600}}>{cg?.name}</span>
          <span>{fmtD(n.date)} {fmtT(n.date)}</span>
        </div>
        <span className={`tag ${n.category==="Health"?"tag-er":n.category==="ADL"?"tag-bl":"tag-ok"}`} style={{marginBottom:6,display:"inline-flex"}}>{n.category}</span>
        <div style={{fontSize:13,lineHeight:1.6,marginTop:4}}>{n.text}</div>
      </div>;})}
      {clNotes.length===0&& <div className="empty">No care notes yet</div>}
    </div>}
  </div>;
}

// ═══════════════════════════════════════════════════════════════════════
// CARE MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════
function CarePage({clients,caregivers,chores,setChores,incidents,setIncidents,careNotes,setCareNotes,modal,setModal}){
  const [tab,setTab]=useState("tasks");

  return <div>
    <div className="hdr"><div><h2>Care Management</h2><div className="hdr-sub">Tasks, incidents, and case management</div></div>
      <div style={{display:"flex",gap:8}}>
        <button className="btn btn-p btn-sm" onClick={()=>setModal("note")}>📝 Care Note</button>
        <button className="btn btn-er btn-sm" onClick={()=>setModal("incident")}>⚠️ Incident</button>
      </div>
    </div>

    {/* AI Case Agent */}
    <div className="ai-card">
      <h4><span className="pulse" style={{background:"var(--ok)"}}/>CWIN Case Management Agent</h4>
      <p>
        <strong>Active Flags:</strong> {incidents.filter(i=>i.status==="open").length} open incidents requiring follow-up.
        {incidents.filter(i=>i.status==="open").map(i=>{const cl=clients.find(c=>c.id===i.clientId);return` ${cl?.name}: ${i.type} (${i.severity}) — ${i.followUp||"needs follow-up plan"}. `;})}
        <br/><strong>Recommendations:</strong> Schedule care plan review for Linda Frank (2 incidents in 10 days). Verify medication compliance for Steven Brown. All chore schedules current.
      </p>
    </div>

    <div className="tab-row">
      {["tasks","incidents","notes","agent"].map(t=><button key={t} className={`tab-btn ${tab===t?"act":""}`} onClick={()=>setTab(t)}>{({tasks:"📋 Tasks & Chores",incidents:"⚠️ Incidents",notes:"📝 Care Notes",agent:"🤖 Case Agent"})[t]}</button>)}
    </div>

    {tab==="tasks"&&<div className="card"><div className="card-h"><h3>Active Tasks & Chores</h3></div>
      <div className="tw"><table><thead><tr><th>Task</th><th>Client</th><th>Frequency</th><th>Assigned</th><th>Last Done</th><th>Priority</th><th>Status</th></tr></thead><tbody>
        {chores.map(ch=>{const cl=clients.find(c=>c.id===ch.clientId);const cg=caregivers.find(c=>c.id===ch.assignedTo);
          return <tr key={ch.id}><td style={{fontWeight:600}}>{ch.title}</td><td>{cl?.name}</td><td>{ch.frequency}</td><td>{cg?.name}</td><td>{fmtD(ch.lastDone)}</td>
            <td><span className={`tag ${ch.priority==="high"?"tag-er":"tag-ok"}`}>{ch.priority}</span></td>
            <td><button className="btn btn-sm btn-ok" onClick={()=>setChores(p=>p.map(c=>c.id===ch.id?{...c,lastDone:today()}:c))}>✓ Done</button></td></tr>;})}
      </tbody></table></div>
    </div>}

    {tab==="incidents"&&<div className="card"><div className="card-h"><h3>Incident Reports</h3></div>
      <div className="tw"><table><thead><tr><th>Date</th><th>Client</th><th>Type</th><th>Severity</th><th>Description</th><th>Family</th><th>Status</th><th>Action</th></tr></thead><tbody>
        {incidents.sort((a,b)=>new Date(b.date)-new Date(a.date)).map(inc=>{const cl=clients.find(c=>c.id===inc.clientId);
          return <tr key={inc.id}><td>{fmtD(inc.date)}</td><td style={{fontWeight:600}}>{cl?.name}</td><td>{inc.type}</td>
            <td><span className={`tag ${inc.severity==="low"?"tag-wn":inc.severity==="medium"?"tag-er":"tag-er"}`}>{inc.severity}</span></td>
            <td style={{maxWidth:200,fontSize:12}}>{inc.description.slice(0,80)}...</td>
            <td>{inc.familyNotified?<span className="tag tag-ok">Yes</span>:<span className="tag tag-wn">No</span>}</td>
            <td><span className={`tag ${inc.status==="resolved"?"tag-ok":"tag-er"}`}>{inc.status}</span></td>
            <td>{inc.status==="open"&&<button className="btn btn-sm btn-ok" onClick={()=>setIncidents(p=>p.map(i=>i.id===inc.id?{...i,status:"resolved"}:i))}>Resolve</button>}</td></tr>;})}
      </tbody></table></div>
    </div>}

    {tab==="notes"&&<div className="card"><div className="card-h"><h3>Care Notes</h3></div>
      {careNotes.sort((a,b)=>new Date(b.date)-new Date(a.date)).map(n=>{const cl=clients.find(c=>c.id===n.clientId);const cg=caregivers.find(c=>c.id===n.caregiverId);
        return <div key={n.id} style={{padding:"12px 18px",borderBottom:"1px solid var(--bdr)"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
            <div style={{display:"flex",gap:8,alignItems:"center"}}><span className={`tag ${n.category==="Health"?"tag-er":n.category==="ADL"?"tag-bl":"tag-ok"}`}>{n.category}</span><span style={{fontWeight:600,fontSize:13}}>{cg?.name} → {cl?.name}</span></div>
            <span style={{fontSize:11,color:"var(--t2)"}}>{fmtD(n.date)} {fmtT(n.date)}</span>
          </div>
          <div style={{fontSize:13,lineHeight:1.6}}>{n.text}</div>
        </div>;})}
    </div>}

    {tab==="agent"&&<div>
      <div className="ai-card">
        <h4>🤖 Agentic Case Management</h4>
        <p>The CWIN Case Agent continuously monitors all client data, incidents, care notes, chore completion, and health trends to provide proactive recommendations.</p>
      </div>
      {clients.map(cl=>{const clInc=incidents.filter(i=>i.clientId===cl.id);const clNotes=careNotes.filter(n=>n.clientId===cl.id);
        return <div key={cl.id} className="card card-b" style={{marginBottom:12}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
            <div style={{fontFamily:"var(--fd)",fontSize:16,fontWeight:400}}>{cl.name}</div>
            <span className={`tag tag-${cl.riskLevel==="low"?"ok":cl.riskLevel==="medium"?"wn":"er"}`}>Risk: {cl.riskLevel}</span>
          </div>
          <div style={{fontSize:12,lineHeight:1.7,color:"var(--t2)"}}>
            <div><strong>Incidents:</strong> {clInc.length} total ({clInc.filter(i=>i.status==="open").length} open)</div>
            <div><strong>Recent Notes:</strong> {clNotes.length} entries</div>
            <div><strong>Diagnoses:</strong> {cl.dx.join(", ")}</div>
            <div style={{marginTop:8,padding:"8px 12px",background:"var(--bg)",borderRadius:"var(--rs)",borderLeft:"3px solid var(--purple)"}}>
              <strong style={{color:"var(--purple)"}}>AI Assessment:</strong> {cl.riskLevel==="medium"?`Elevated monitoring recommended. ${cl.dx.length} active conditions with ${clInc.length} recent incident${clInc.length!==1?"s":""}. Consider care plan review.`:`Current care plan adequate. Continue monitoring at standard frequency.`}
            </div>
          </div>
        </div>;})}
    </div>}

    {/* MODALS */}
    {modal==="note"&&<div className="modal-bg" onClick={()=>setModal(null)}><div className="modal" onClick={e=>e.stopPropagation()}>
      <div className="modal-h">📝 New Care Note<button className="btn btn-sm btn-s" onClick={()=>setModal(null)}>✕</button></div>
      <NoteForm clients={clients} caregivers={caregivers} onSave={n=>{setCareNotes(p=>[{id:"CN"+uid(),...n,date:now().toISOString()},...p]);setModal(null);}}/>
    </div></div>}
    {modal==="incident"&&<div className="modal-bg" onClick={()=>setModal(null)}><div className="modal" onClick={e=>e.stopPropagation()}>
      <div className="modal-h">⚠️ Incident Report<button className="btn btn-sm btn-s" onClick={()=>setModal(null)}>✕</button></div>
      <IncidentForm clients={clients} caregivers={caregivers} onSave={inc=>{setIncidents(p=>[{id:"IR"+uid(),...inc,date:now().toISOString(),status:"open"},...p]);setModal(null);}}/>
    </div></div>}
  </div>;
}

function NoteForm({clients,caregivers,onSave}){
  const [f,sF]=useState({clientId:"CL1",caregiverId:"CG1",category:"General",text:""});
  return <div className="modal-b"><div className="fg" style={{marginBottom:12}}>
    <div className="fi"><label>Client</label><select value={f.clientId} onChange={e=>sF({...f,clientId:e.target.value})}>{clients.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
    <div className="fi"><label>Caregiver</label><select value={f.caregiverId} onChange={e=>sF({...f,caregiverId:e.target.value})}>{caregivers.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
    <div className="fi"><label>Category</label><select value={f.category} onChange={e=>sF({...f,category:e.target.value})}>{["General","Health","ADL","Medication","Behavioral","Social"].map(c=><option key={c}>{c}</option>)}</select></div>
  </div><div className="fi" style={{marginBottom:12}}><label>Note</label><textarea rows={4} value={f.text} onChange={e=>sF({...f,text:e.target.value})} placeholder="Document care provided, observations, client status..."/></div>
  <button className="btn btn-p" onClick={()=>f.text&&onSave(f)} disabled={!f.text}>Save Note</button></div>;
}

function IncidentForm({clients,caregivers,onSave}){
  const [f,sF]=useState({clientId:"CL1",caregiverId:"CG1",type:"Fall",severity:"low",description:"",followUp:"",familyNotified:false});
  return <div className="modal-b"><div className="fg" style={{marginBottom:12}}>
    <div className="fi"><label>Client</label><select value={f.clientId} onChange={e=>sF({...f,clientId:e.target.value})}>{clients.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
    <div className="fi"><label>Caregiver</label><select value={f.caregiverId} onChange={e=>sF({...f,caregiverId:e.target.value})}>{caregivers.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
    <div className="fi"><label>Type</label><select value={f.type} onChange={e=>sF({...f,type:e.target.value})}>{["Fall","Near Fall","Medication Issue","Emergency Call","Behavioral","Skin Integrity","Other"].map(t=><option key={t}>{t}</option>)}</select></div>
    <div className="fi"><label>Severity</label><select value={f.severity} onChange={e=>sF({...f,severity:e.target.value})}>{["low","medium","high","critical"].map(s=><option key={s}>{s}</option>)}</select></div>
  </div>
  <div className="fi" style={{marginBottom:12}}><label>Description</label><textarea rows={3} value={f.description} onChange={e=>sF({...f,description:e.target.value})} placeholder="Describe what happened..."/></div>
  <div className="fi" style={{marginBottom:12}}><label>Follow-up Plan</label><input value={f.followUp} onChange={e=>sF({...f,followUp:e.target.value})} placeholder="Required actions..."/></div>
  <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:16}}><input type="checkbox" checked={f.familyNotified} onChange={e=>sF({...f,familyNotified:e.target.checked})}/><label style={{fontSize:13}}>Family has been notified</label></div>
  <button className="btn btn-er" onClick={()=>f.description&&onSave(f)} disabled={!f.description}>Submit Incident Report</button></div>;
}

// ═══════════════════════════════════════════════════════════════════════
// EXPENSES
// ═══════════════════════════════════════════════════════════════════════
function ExpensesPage({expenses,setExpenses,caregivers,clients}){
  const pending=expenses.filter(e=>e.status==="pending");
  const approved=expenses.filter(e=>e.status==="approved");
  const [showAdd,setShowAdd]=useState(false);
  const [f,sF]=useState({caregiverId:"CG1",clientId:"CL1",category:"Groceries",description:"",amount:0,receipt:false,gps:""});

  const submit=()=>{if(!f.description||f.amount<=0)return;setExpenses(p=>[{id:"EX"+uid(),date:today(),...f,status:"pending"},...p]);sF({caregiverId:"CG1",clientId:"CL1",category:"Groceries",description:"",amount:0,receipt:false,gps:""});setShowAdd(false);};

  return <div>
    <div className="hdr"><div><h2>Expenses</h2><div className="hdr-sub">Track, approve, and feed to client billing</div></div>
      <button className="btn btn-p btn-sm" onClick={()=>setShowAdd(!showAdd)}>+ Log Expense</button>
    </div>
    <div className="sg">
      <div className="sc wn"><span className="sl">Pending</span><span className="sv">{$(pending.reduce((s,e)=>s+e.amount,0))}</span><span className="ss">{pending.length} expenses</span></div>
      <div className="sc ok"><span className="sl">Approved</span><span className="sv">{$(approved.reduce((s,e)=>s+e.amount,0))}</span><span className="ss">{approved.length} expenses</span></div>
      <div className="sc bl"><span className="sl">Billable to Clients</span><span className="sv">{$(approved.filter(e=>["Groceries","Pharmacy","Supplies"].includes(e.category)).reduce((s,e)=>s+e.amount,0))}</span><span className="ss">Auto-feeds to invoices</span></div>
    </div>

    {showAdd&&<div className="card card-b"><div className="fg" style={{marginBottom:12}}>
      <div className="fi"><label>Caregiver</label><select value={f.caregiverId} onChange={e=>sF({...f,caregiverId:e.target.value})}>{caregivers.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
      <div className="fi"><label>Client</label><select value={f.clientId} onChange={e=>sF({...f,clientId:e.target.value})}>{clients.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
      <div className="fi"><label>Category</label><select value={f.category} onChange={e=>sF({...f,category:e.target.value})}>{["Groceries","Pharmacy","Supplies","Transportation","Mileage","Meals","Other"].map(c=><option key={c}>{c}</option>)}</select></div>
    </div><div className="fg" style={{marginBottom:12}}>
      <div className="fi" style={{flex:2}}><label>Description</label><input value={f.description} onChange={e=>sF({...f,description:e.target.value})} placeholder="What was purchased?"/></div>
      <div className="fi"><label>Amount</label><input type="number" value={f.amount||""} onChange={e=>sF({...f,amount:+e.target.value})} step="0.01"/></div>
      <div className="fi"><label>GPS Location</label><input value={f.gps} onChange={e=>sF({...f,gps:e.target.value})} placeholder="Store name & address"/></div>
    </div>
    <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:12}}><input type="checkbox" checked={f.receipt} onChange={e=>sF({...f,receipt:e.target.checked})}/><label style={{fontSize:13}}>Receipt photo captured</label></div>
    <div style={{display:"flex",gap:8}}><button className="btn btn-p" onClick={submit}>Submit</button><button className="btn btn-s" onClick={()=>setShowAdd(false)}>Cancel</button></div>
    </div>}

    <div className="card"><div className="card-h"><h3>All Expenses</h3></div>
      <div className="tw"><table><thead><tr><th>Date</th><th>Caregiver</th><th>Client</th><th>Category</th><th>Description</th><th style={{textAlign:"right"}}>Amount</th><th>Receipt</th><th>GPS</th><th>Status</th><th>Actions</th></tr></thead><tbody>
        {expenses.sort((a,b)=>b.date.localeCompare(a.date)).map(e=>{const cg=caregivers.find(c=>c.id===e.caregiverId);const cl=clients.find(c=>c.id===e.clientId);
          return <tr key={e.id}><td>{fmtD(e.date)}</td><td>{cg?.name}</td><td style={{fontWeight:600}}>{cl?.name}</td>
            <td><span className="tag tag-bl">{e.category}</span></td><td>{e.description}</td>
            <td style={{textAlign:"right",fontWeight:700}}>{$(e.amount)}</td>
            <td>{e.receipt?"📷":"—"}</td>
            <td style={{fontSize:10,maxWidth:100}} title={e.gps}>{e.gps?`📍 ${e.gps.split(",")[0]}`:"—"}</td>
            <td><span className={`tag ${e.status==="approved"?"tag-ok":"tag-wn"}`}>{e.status}</span></td>
            <td>{e.status==="pending"&&<div style={{display:"flex",gap:4}}>
              <button className="btn btn-sm btn-ok" onClick={()=>setExpenses(p=>p.map(x=>x.id===e.id?{...x,status:"approved"}:x))}>✓</button>
              <button className="btn btn-sm btn-er" onClick={()=>setExpenses(p=>p.map(x=>x.id===e.id?{...x,status:"rejected"}:x))}>✕</button>
            </div>}</td></tr>;})}
      </tbody></table></div>
    </div>
  </div>;
}

// ═══════════════════════════════════════════════════════════════════════
// TRAINING ACADEMY
// ═══════════════════════════════════════════════════════════════════════
function TrainingPage({caregivers,progress,setProgress,modal,setModal}){
  const [selMod,setSelMod]=useState(null);
  const [selCG,setSelCG]=useState("");

  return <div>
    <div className="hdr"><div><h2>Training Academy</h2><div className="hdr-sub">{TRAINING_MODULES.length} modules covering home care essentials</div></div></div>

    {/* Team Progress */}
    <div className="sg">{caregivers.map(cg=>{
      const done=(progress[cg.id]||[]).length;const pct=Math.round(done/TRAINING_MODULES.length*100);
      return <div key={cg.id} className="sc" style={{borderColor:pct===100?"var(--ok)":pct>=60?"var(--blue)":"var(--warn)"}}>
        <span className="sl">{cg.name}</span><span className="sv">{pct}%</span>
        <div className="progress-bar" style={{marginTop:6}}><div className="progress-fill" style={{width:`${pct}%`,background:pct===100?"var(--ok)":"var(--blue)"}}/></div>
        <span className="ss">{done}/{TRAINING_MODULES.length} complete</span>
      </div>;})}</div>

    {/* Module Grid */}
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:14}}>
      {TRAINING_MODULES.map((mod,idx)=>{
        const completedBy=Object.entries(progress).filter(([_,arr])=>arr.includes(idx)).map(([cgId])=>caregivers.find(c=>c.id===cgId)?.name).filter(Boolean);
        const catColor={Compliance:"var(--purple)",Safety:"var(--err)",Clinical:"var(--blue)","Daily Living":"var(--ok)"}[mod.category]||"var(--blue)";
        return <div key={mod.id} className="card" style={{cursor:"pointer"}} onClick={()=>setSelMod(idx)}>
          <div style={{padding:"16px 18px"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
              <span className="tag" style={{background:catColor+"20",color:catColor}}>{mod.category}</span>
              <span style={{fontSize:11,color:"var(--t2)"}}>{mod.duration}</span>
            </div>
            <div style={{fontFamily:"var(--fd)",fontSize:15,fontWeight:400,marginBottom:4}}>{mod.title}</div>
            <div style={{fontSize:12,color:"var(--t2)",lineHeight:1.5,marginBottom:10}}>{mod.description.slice(0,100)}...</div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div style={{display:"flex",gap:-4}}>{completedBy.slice(0,4).map((name,i)=><div key={i} className="avatar" style={{width:24,height:24,fontSize:9,background:"#111",color:"#fff",marginLeft:i>0?-6:0,border:"2px solid #fff"}}>{name.split(" ").map(n=>n[0]).join("")}</div>)}</div>
              <span style={{fontSize:11,color:"var(--t2)"}}>{completedBy.length}/{caregivers.length} complete</span>
            </div>
          </div>
        </div>;
      })}
    </div>

    {/* Module Detail Modal */}
    {selMod!==null&&<div className="modal-bg" onClick={()=>setSelMod(null)}><div className="modal" style={{maxWidth:640}} onClick={e=>e.stopPropagation()}>
      <div className="modal-h">{TRAINING_MODULES[selMod].title}<button className="btn btn-sm btn-s" onClick={()=>setSelMod(null)}>✕</button></div>
      <div className="modal-b">
        <div style={{display:"flex",gap:8,marginBottom:14,flexWrap:"wrap"}}>
          <span className="tag tag-bl">{TRAINING_MODULES[selMod].category}</span>
          <span className="tag tag-pu">{TRAINING_MODULES[selMod].duration}</span>
          <span className="tag tag-wn">{TRAINING_MODULES[selMod].difficulty}</span>
        </div>
        <p style={{fontSize:13,lineHeight:1.6,marginBottom:16}}>{TRAINING_MODULES[selMod].description}</p>
        <h4 style={{fontSize:13,fontWeight:700,marginBottom:8}}>Lessons</h4>
        {TRAINING_MODULES[selMod].lessons.map((l,i)=><div key={i} style={{padding:"8px 0",borderBottom:"1px solid var(--bdr)",display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:24,height:24,borderRadius:0,background:"var(--bg)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:"var(--t2)"}}>{i+1}</div>
          <span style={{fontSize:13}}>{l}</span>
        </div>)}
        {TRAINING_MODULES[selMod].quiz.length>0&&<><h4 style={{fontSize:13,fontWeight:700,margin:"16px 0 8px"}}>Quiz Preview</h4>
          {TRAINING_MODULES[selMod].quiz.map((q,i)=><div key={i} style={{padding:"10px 0",borderBottom:"1px solid var(--bdr)"}}>
            <div style={{fontSize:13,fontWeight:600,marginBottom:6}}>{q.q}</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>{q.opts.map((o,j)=><div key={j} style={{padding:"6px 10px",borderRadius:"var(--rs)",fontSize:12,background:j===q.a?"var(--ok-l)":"var(--bg)",border:j===q.a?"1px solid var(--ok)":"1px solid var(--bdr)"}}>{o}</div>)}</div>
          </div>)}</>}
        <h4 style={{fontSize:13,fontWeight:700,margin:"16px 0 8px"}}>Completion Status</h4>
        {caregivers.map(cg=>{const done=(progress[cg.id]||[]).includes(selMod);
          return <div key={cg.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:"1px solid var(--bdr)"}}>
            <span style={{fontSize:13,fontWeight:600}}>{cg.name}</span>
            {done?<span className="tag tag-ok">Complete</span>:<button className="btn btn-sm btn-p" onClick={()=>setProgress(p=>({...p,[cg.id]:[...(p[cg.id]||[]),selMod]}))}>Mark Complete</button>}
          </div>;})}
      </div>
    </div></div>}
  </div>;
}

// ═══════════════════════════════════════════════════════════════════════
// CLIENT PORTAL — Full interactive client-facing experience
// ═══════════════════════════════════════════════════════════════════════
function ClientPortalPage({clients,caregivers,sel,setSel,serviceRequests,setServiceRequests,surveys,setSurveys,careGoals,vitals,setVitals,documents,careNotes,events,expenses,familyMsgs,setFamilyMsgs}){
  const cl=clients.find(c=>c.id===sel)||clients[0];
  const [tab,setTab]=useState("home");
  const [showRequest,setShowRequest]=useState(false);
  const [showSurvey,setShowSurvey]=useState(false);
  const [showVital,setShowVital]=useState(false);
  const [msgText,setMsgText]=useState("");

  const clNotes=careNotes.filter(n=>n.clientId===cl.id).sort((a,b)=>new Date(b.date)-new Date(a.date));
  const clEvents=events.filter(e=>e.clientId===cl.id && new Date(e.date)>=now()).sort((a,b)=>new Date(a.date)-new Date(b.date));
  const clGoals=careGoals.filter(g=>g.clientId===cl.id);
  const clVitals=vitals.filter(v=>v.clientId===cl.id).sort((a,b)=>b.date.localeCompare(a.date));
  const clDocs=documents.filter(d=>d.clientId===cl.id);
  const clRequests=serviceRequests.filter(r=>r.clientId===cl.id).sort((a,b)=>new Date(b.date)-new Date(a.date));
  const clSurveys=surveys.filter(s=>s.clientId===cl.id).sort((a,b)=>new Date(b.date)-new Date(a.date));
  const clExpenses=expenses.filter(e=>e.clientId===cl.id && e.status==="approved");
  const clMsgs=familyMsgs.filter(m=>m.clientId===cl.id).sort((a,b)=>new Date(a.date)-new Date(b.date));
  const assignedCGs=[...new Set(clNotes.map(n=>n.caregiverId))].map(id=>caregivers.find(c=>c.id===id)).filter(Boolean);

  const sendMsg=()=>{if(!msgText.trim())return;setFamilyMsgs(p=>[...p,{id:"FM"+uid(),clientId:cl.id,from:cl.name,fromType:"family",date:now().toISOString(),text:msgText}]);setMsgText("");};

  const tabs=[
    {key:"home",label:"🏠 Home",show:true},
    {key:"schedule",label:"📅 Schedule",show:true},
    {key:"health",label:"❤️ Health",show:true},
    {key:"goals",label:"🎯 Goals",show:true},
    {key:"messages",label:"💬 Messages",show:true},
    {key:"requests",label:"📩 Requests",show:true},
    {key:"billing",label:"💰 Billing",show:true},
    {key:"documents",label:"📁 Documents",show:true},
    {key:"feedback",label:"⭐ Feedback",show:true},
  ];

  return <div>
    {/* Portal Header */}
    <div style={{background:"#111",color:"#fff",borderRadius:"var(--r)",padding:"24px 28px",marginBottom:16,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
      <div style={{display:"flex",gap:16,alignItems:"center"}}>
        <div className="avatar" style={{width:56,height:56,fontSize:22,background:"rgba(255,255,255,.12)",color:"#fff"}}>{cl.name.split(" ").map(n=>n[0]).join("")}</div>
        <div>
          <div style={{fontSize:11,textTransform:"uppercase",letterSpacing:1,opacity:.4,marginBottom:2}}>Client Portal</div>
          <div style={{fontFamily:"var(--fd)",fontSize:22,fontWeight:900}}>{cl.name}</div>
          <div style={{fontSize:12,opacity:.5,marginTop:2}}>{cl.addr}</div>
        </div>
      </div>
      <div style={{display:"flex",gap:12,alignItems:"center"}}>
        <select value={sel} onChange={e=>setSel(e.target.value)} style={{padding:"8px 12px",borderRadius:"var(--rs)",border:"1px solid rgba(255,255,255,.15)",background:"rgba(255,255,255,.08)",color:"#fff",fontFamily:"var(--f)",fontWeight:600,fontSize:12}}>
          {clients.map(c=> <option key={c.id} value={c.id} style={{color:"#000"}}>{c.name}</option>)}
        </select>
        <div style={{textAlign:"right"}}>
          <div style={{fontSize:10,opacity:.4,textTransform:"uppercase"}}>Care Team</div>
          <div style={{display:"flex",gap:-4,marginTop:4}}>{assignedCGs.slice(0,3).map((cg,i)=> <div key={cg.id} className="avatar" style={{width:28,height:28,fontSize:9,background:"rgba(255,255,255,.15)",color:"#fff",marginLeft:i>0?-8:0,border:"2px solid #111"}}>{cg.avatar}</div>)}</div>
        </div>
      </div>
    </div>

    {/* Tab Bar */}
    <div className="tab-row" style={{overflowX:"auto",whiteSpace:"nowrap",paddingBottom:0}}>
      {tabs.filter(t=>t.show).map(t=> <button key={t.key} className={`tab-btn ${tab===t.key?"act":""}`} onClick={()=>setTab(t.key)}>{t.label}</button>)}
    </div>

    {/* ═══ HOME ═══ */}
    {tab==="home"&& <div>
      {/* Welcome Card */}
      <div className="ai-card">
        <h4><span className="pulse" style={{background:"var(--ok)"}}/>Welcome, {cl.name.split(" ")[0]}</h4>
        <p>
          {clEvents.length>0?`Your next appointment is ${clEvents[0].title} on ${fmtD(clEvents[0].date)}. `:"No upcoming appointments. "}
          {clGoals.filter(g=>g.status==="at-risk").length>0?`${clGoals.filter(g=>g.status==="at-risk").length} care goal${clGoals.filter(g=>g.status==="at-risk").length>1?"s":""} need${clGoals.filter(g=>g.status==="at-risk").length===1?"s":""} attention. `:"All care goals on track! "}
          {clRequests.filter(r=>r.status==="pending").length>0?`You have ${clRequests.filter(r=>r.status==="pending").length} pending request${clRequests.filter(r=>r.status==="pending").length>1?"s":""}.`:""}
          Your care team is here for you. 💛
        </p>
      </div>

      <div className="sg">
        <div className="sc ok" style={{cursor:"pointer"}} onClick={()=>setTab("health")}><span className="sl">Last Vitals</span><span className="sv">{clVitals[0]?.bp||"—"}</span><span className="ss">{clVitals[0]?fmtD(clVitals[0].date):"No records"}</span></div>
        <div className="sc bl" style={{cursor:"pointer"}} onClick={()=>setTab("schedule")}><span className="sl">Next Event</span><span className="sv" style={{fontSize:16}}>{clEvents[0]?.title||"None"}</span><span className="ss">{clEvents[0]?fmtD(clEvents[0].date):""}</span></div>
        <div className="sc pu" style={{cursor:"pointer"}} onClick={()=>setTab("goals")}><span className="sl">Care Goals</span><span className="sv">{clGoals.filter(g=>g.status==="achieved").length}/{clGoals.length}</span><span className="ss">{clGoals.filter(g=>g.status==="at-risk").length} need attention</span></div>
        <div className="sc wn" style={{cursor:"pointer"}} onClick={()=>setTab("requests")}><span className="sl">Requests</span><span className="sv">{clRequests.filter(r=>r.status==="pending").length}</span><span className="ss">pending</span></div>
      </div>

      {/* Recent Care Notes */}
      <div className="card"><div className="card-h"><h3>Recent Care Updates</h3><button className="btn btn-sm btn-s" onClick={()=>setTab("messages")}>View All</button></div>
        {clNotes.slice(0,3).map(n=>{const cg=caregivers.find(c=>c.id===n.caregiverId);return <div key={n.id} style={{padding:"10px 18px",borderBottom:"1px solid var(--bdr)"}}>
          <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:"var(--t2)",marginBottom:4}}><span style={{fontWeight:600}}>{cg?.name}</span><span>{fmtRel(n.date)}</span></div>
          <div style={{fontSize:13,lineHeight:1.6}}>{n.text}</div>
        </div>;})}
      </div>

      {/* Quick Actions */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10}}>
        <button className="btn btn-p" style={{flexDirection:"column",padding:16,height:"auto",gap:8}} onClick={()=>{setTab("requests");setShowRequest(true);}}>📩<span>New Request</span></button>
        <button className="btn btn-s" style={{flexDirection:"column",padding:16,height:"auto",gap:8}} onClick={()=>setTab("messages")}>💬<span>Messages</span></button>
        <button className="btn btn-s" style={{flexDirection:"column",padding:16,height:"auto",gap:8}} onClick={()=>{setTab("feedback");setShowSurvey(true);}}>⭐<span>Give Feedback</span></button>
        <button className="btn btn-s" style={{flexDirection:"column",padding:16,height:"auto",gap:8}} onClick={()=>setTab("health")}>❤️<span>Vitals</span></button>
      </div>
    </div>}

    {/* ═══ SCHEDULE ═══ */}
    {tab==="schedule"&& <div>
      <div className="card"><div className="card-h"><h3>Upcoming Events & Appointments</h3></div>
        {clEvents.length===0&& <div className="empty">No upcoming events scheduled</div>}
        {clEvents.map(ev=> <div key={ev.id} style={{padding:"14px 18px",borderBottom:"1px solid var(--bdr)",display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
          <div style={{flex:1}}>
            <div style={{fontFamily:"var(--fd)",fontSize:15,fontWeight:400}}>{ev.title}</div>
            <div style={{fontSize:12,color:"var(--t2)",marginTop:2}}>{fmtD(ev.date)} at {fmtT(ev.date)}</div>
            {ev.notes&& <div style={{fontSize:12,color:"var(--t2)",marginTop:4,lineHeight:1.5}}>{ev.notes}</div>}
          </div>
          <span className={`tag ${ev.type==="medical"?"tag-er":"tag-bl"}`}>{ev.type}</span>
        </div>)}
      </div>
      <div className="card"><div className="card-h"><h3>My Care Team</h3></div>
        {assignedCGs.map(cg=> <div key={cg.id} style={{padding:"12px 18px",borderBottom:"1px solid var(--bdr)",display:"flex",gap:12,alignItems:"center"}}>
          <div className="avatar" style={{width:42,height:42,fontSize:14,background:"#111",color:"#fff"}}>{cg.avatar}</div>
          <div style={{flex:1}}><div style={{fontWeight:700,fontSize:14}}>{cg.name}</div><div style={{fontSize:12,color:"var(--t2)"}}>{cg.certs.join(", ")}</div></div>
          <div style={{fontSize:12,color:"var(--t2)"}}>{cg.phone}</div>
        </div>)}
      </div>
      <div className="card card-b">
        <h3 style={{fontSize:14,fontWeight:700,marginBottom:8}}>My Preferences</h3>
        <div className="fg" style={{gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))"}}>
          {Object.entries(cl.preferences).map(([k,v])=> <div key={k}><div style={{fontSize:10,textTransform:"uppercase",color:"var(--t2)",fontWeight:600,marginBottom:3}}>{k.replace(/([A-Z])/g," $1")}</div><div style={{fontSize:13,fontWeight:600}}>{Array.isArray(v)?v.join(", "):v}</div></div>)}
        </div>
      </div>
    </div>}

    {/* ═══ HEALTH ═══ */}
    {tab==="health"&& <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
        <h3 style={{fontFamily:"var(--fd)",fontSize:16}}>Health Dashboard</h3>
        <button className="btn btn-p btn-sm" onClick={()=>setShowVital(true)}>+ Record Vitals</button>
      </div>

      {/* Current Meds */}
      <div className="card"><div className="card-h"><h3>Current Medications</h3><span className="tag tag-bl">{cl.meds.length} active</span></div>
        <div className="card-b"><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:8}}>
          {cl.meds.map((m,i)=> <div key={i} style={{padding:"10px 14px",background:"var(--bg)",borderRadius:"var(--rs)",fontSize:13,fontWeight:600,borderLeft:"3px solid var(--blue)"}}>{m}</div>)}
        </div></div>
      </div>

      {/* Vitals History */}
      <div className="card"><div className="card-h"><h3>Vitals History</h3></div>
        {clVitals.length===0? <div className="empty">No vitals recorded</div>:
        <div className="tw"><table><thead><tr><th>Date</th><th>Blood Pressure</th><th>Heart Rate</th><th>Temp</th>{clVitals.some(v=>v.glucose)&& <th>Glucose</th>}<th>Weight</th><th>Notes</th></tr></thead><tbody>
          {clVitals.map(v=> <tr key={v.id}>
            <td style={{fontWeight:600}}>{fmtD(v.date)}</td>
            <td><span style={{fontFamily:"var(--fd)",fontWeight:900,fontSize:15}}>{v.bp}</span></td>
            <td>{v.hr} bpm</td>
            <td>{v.temp}°F</td>
            {clVitals.some(vv=>vv.glucose)&& <td>{v.glucose||"—"} mg/dL</td>}
            <td>{v.weight} lbs</td>
            <td style={{fontSize:12,color:"var(--t2)",maxWidth:200}}>{v.notes||"—"}</td>
          </tr>)}
        </tbody></table></div>}
      </div>

      {/* Diagnoses & ADL */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
        <div className="card"><div className="card-h"><h3>Diagnoses</h3></div><div className="card-b">
          {cl.dx.map((d,i)=> <div key={i} style={{padding:"6px 0",borderBottom:i<cl.dx.length-1?"1px solid var(--bdr)":"",fontSize:13}}><span className="tag tag-er" style={{marginRight:6}}>{i+1}</span>{d}</div>)}
        </div></div>
        <div className="card"><div className="card-h"><h3>Daily Living Status</h3></div><div className="card-b">
          {Object.entries(cl.adl).map(([k,v],i)=> <div key={k} style={{padding:"6px 0",borderBottom:i<Object.keys(cl.adl).length-1?"1px solid var(--bdr)":"",fontSize:13,display:"flex",justifyContent:"space-between"}}><span style={{textTransform:"capitalize",fontWeight:600}}>{k}</span><span style={{color:"var(--t2)",fontSize:11,textAlign:"right",maxWidth:"65%"}}>{v.split(" — ")[0]}</span></div>)}
        </div></div>
      </div>

      {/* Record Vital Modal */}
      {showVital&& <div className="modal-bg" onClick={()=>setShowVital(false)}><div className="modal" onClick={e=>e.stopPropagation()}>
        <div className="modal-h">Record Vitals<button className="btn btn-sm btn-s" onClick={()=>setShowVital(false)}>✕</button></div>
        <VitalForm clientId={cl.id} onSave={v=>{setVitals(p=>[{id:"V"+uid(),...v},...p]);setShowVital(false);}}/>
      </div></div>}
    </div>}

    {/* ═══ GOALS ═══ */}
    {tab==="goals"&& <div>
      <div className="sg">
        <div className="sc ok"><span className="sl">Achieved</span><span className="sv">{clGoals.filter(g=>g.status==="achieved").length}</span></div>
        <div className="sc bl"><span className="sl">On Track</span><span className="sv">{clGoals.filter(g=>g.status==="on-track").length}</span></div>
        <div className="sc er"><span className="sl">At Risk</span><span className="sv">{clGoals.filter(g=>g.status==="at-risk").length}</span></div>
      </div>
      {clGoals.map(g=> <div key={g.id} className="card card-b" style={{borderLeft:`4px solid ${g.status==="achieved"?"var(--ok)":g.status==="on-track"?"var(--blue)":"var(--err)"}`}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
          <div><div style={{fontFamily:"var(--fd)",fontSize:16,fontWeight:400}}>{g.title}</div><div style={{fontSize:12,color:"var(--t2)",marginTop:2}}>{g.category} • Target: {g.target}</div></div>
          <span className={`tag ${g.status==="achieved"?"tag-ok":g.status==="on-track"?"tag-bl":"tag-er"}`}>{g.status.replace("-"," ").toUpperCase()}</span>
        </div>
        <div className="progress-bar" style={{marginBottom:8}}><div className="progress-fill" style={{width:`${g.progress}%`,background:g.status==="achieved"?"var(--ok)":g.status==="on-track"?"var(--blue)":"var(--err)"}}/></div>
        <div style={{display:"flex",justifyContent:"space-between",fontSize:12}}><span style={{color:"var(--t2)"}}>{g.notes}</span><span style={{fontWeight:700}}>{g.progress}%</span></div>
      </div>)}
      {clGoals.length===0&& <div className="card card-b empty">No care goals set yet</div>}
    </div>}

    {/* ═══ MESSAGES ═══ */}
    {tab==="messages"&& <div style={{display:"grid",gridTemplateColumns:"1fr 340px",gap:14}}>
      {/* Care Notes Feed */}
      <div className="card"><div className="card-h"><h3>Care Updates from Your Team</h3></div>
        {clNotes.map(n=>{const cg=caregivers.find(c=>c.id===n.caregiverId);return <div key={n.id} style={{padding:"12px 18px",borderBottom:"1px solid var(--bdr)"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
            <div style={{display:"flex",gap:8,alignItems:"center"}}><div className="avatar" style={{width:28,height:28,fontSize:10,background:"#111",color:"#fff"}}>{cg?.avatar}</div><span style={{fontWeight:600,fontSize:13}}>{cg?.name}</span></div>
            <span style={{fontSize:11,color:"var(--t2)"}}>{fmtD(n.date)} {fmtT(n.date)}</span>
          </div>
          <span className={`tag ${n.category==="Health"?"tag-er":n.category==="ADL"?"tag-bl":"tag-ok"}`} style={{marginBottom:6,display:"inline-flex"}}>{n.category}</span>
          <div style={{fontSize:13,lineHeight:1.6,marginTop:4}}>{n.text}</div>
        </div>;})}
      </div>

      {/* Direct Messages */}
      <div className="card" style={{display:"flex",flexDirection:"column",maxHeight:"70vh"}}>
        <div className="card-h"><h3>💬 Direct Messages</h3></div>
        <div style={{flex:1,overflow:"auto",padding:"12px 16px",display:"flex",flexDirection:"column",gap:6}}>
          {clMsgs.map(m=> <div key={m.id} style={{display:"flex",flexDirection:"column",alignItems:m.from===cl.name?"flex-end":"flex-start"}}>
            <div className="chat-meta">{m.from} • {fmtRel(m.date)}</div>
            <div className={`chat-bubble ${m.from===cl.name?"chat-fam":"chat-cg"}`}>{m.text}</div>
          </div>)}
          {clMsgs.length===0&& <div className="empty" style={{padding:20}}>Start a conversation with your care team</div>}
        </div>
        <div style={{padding:"10px 14px",borderTop:"1px solid var(--bdr)",display:"flex",gap:8}}>
          <input value={msgText} onChange={e=>setMsgText(e.target.value)} placeholder="Message your care team..." style={{flex:1,padding:"8px 12px",border:"1px solid var(--bdr)",borderRadius:"var(--rs)",fontSize:13,fontFamily:"var(--f)"}} onKeyDown={e=>e.key==="Enter"&&sendMsg()}/>
          <button className="btn btn-p btn-sm" onClick={sendMsg} disabled={!msgText.trim()}>Send</button>
        </div>
      </div>
    </div>}

    {/* ═══ REQUESTS ═══ */}
    {tab==="requests"&& <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
        <h3 style={{fontFamily:"var(--fd)",fontSize:16}}>Service Requests</h3>
        <button className="btn btn-p btn-sm" onClick={()=>setShowRequest(true)}>+ New Request</button>
      </div>
      {clRequests.map(r=> <div key={r.id} className="card card-b">
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
          <div><span className="tag tag-bl" style={{marginRight:8}}>{r.type}</span><span style={{fontSize:11,color:"var(--t2)"}}>{fmtD(r.date)}</span></div>
          <span className={`tag ${r.status==="pending"?"tag-wn":r.status==="approved"||r.status==="completed"||r.status==="acknowledged"?"tag-ok":"tag-er"}`}>{r.status.toUpperCase()}</span>
        </div>
        <div style={{fontSize:13,lineHeight:1.6,marginBottom:8}}>{r.description}</div>
        {r.response&& <div style={{padding:"10px 14px",background:"var(--ok-l)",borderRadius:"var(--rs)",fontSize:12,lineHeight:1.5,borderLeft:"3px solid var(--ok)"}}>
          <strong>Response:</strong> {r.response}<br/><span style={{fontSize:10,color:"var(--t2)"}}>{r.respondedAt?fmtD(r.respondedAt):""}</span>
        </div>}
      </div>)}
      {clRequests.length===0&& <div className="card card-b empty">No requests submitted yet</div>}

      {showRequest&& <div className="modal-bg" onClick={()=>setShowRequest(false)}><div className="modal" onClick={e=>e.stopPropagation()}>
        <div className="modal-h">New Service Request<button className="btn btn-sm btn-s" onClick={()=>setShowRequest(false)}>✕</button></div>
        <RequestForm clientId={cl.id} onSave={r=>{setServiceRequests(p=>[{id:"SR"+uid(),clientId:cl.id,date:now().toISOString(),...r,status:"pending",response:"",respondedAt:""},...p]);setShowRequest(false);}}/>
      </div></div>}
    </div>}

    {/* ═══ BILLING ═══ */}
    {tab==="billing"&& <div>
      <div className="sg">
        <div className="sc bl"><span className="sl">Bill Rate</span><span className="sv">${cl.billRate}/hr</span></div>
        <div className="sc ok"><span className="sl">Approved Expenses</span><span className="sv">{$(clExpenses.reduce((s,e)=>s+e.amount,0))}</span><span className="ss">{clExpenses.length} items</span></div>
      </div>
      <div className="card"><div className="card-h"><h3>Expense Receipts (Billable)</h3></div>
        {clExpenses.length===0? <div className="empty">No approved expenses</div>:
        <div className="tw"><table><thead><tr><th>Date</th><th>Category</th><th>Description</th><th>Receipt</th><th>Location</th><th style={{textAlign:"right"}}>Amount</th></tr></thead><tbody>
          {clExpenses.map(e=>{const cg=caregivers.find(c=>c.id===e.caregiverId);return <tr key={e.id}>
            <td>{fmtD(e.date)}</td>
            <td><span className="tag tag-bl">{e.category}</span></td>
            <td><div style={{fontWeight:600}}>{e.description}</div><div style={{fontSize:11,color:"var(--t2)"}}>by {cg?.name}</div></td>
            <td>{e.receipt?"📷 Yes":"—"}</td>
            <td style={{fontSize:11,color:"var(--t2)",maxWidth:120}} title={e.gps}>{e.gps?`📍 ${e.gps.split(",")[0]}`:"—"}</td>
            <td style={{textAlign:"right",fontWeight:700}}>{$(e.amount)}</td>
          </tr>;})}
          <tr style={{background:"#111",color:"#fff"}}><td colSpan={5} style={{fontWeight:700,borderBottom:"none"}}>Total Billable Expenses</td><td style={{textAlign:"right",fontWeight:900,fontFamily:"var(--fd)",fontSize:16,borderBottom:"none"}}>{$(clExpenses.reduce((s,e)=>s+e.amount,0))}</td></tr>
        </tbody></table></div>}
      </div>
    </div>}

    {/* ═══ DOCUMENTS ═══ */}
    {tab==="documents"&& <div>
      <div className="card"><div className="card-h"><h3>My Documents</h3></div>
        {clDocs.map(d=> <div key={d.id} style={{padding:"12px 18px",borderBottom:"1px solid var(--bdr)",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div style={{display:"flex",gap:12,alignItems:"center"}}>
            <div style={{width:40,height:40,borderRadius:"var(--rs)",background:d.type==="care_plan"?"var(--blue-l)":d.type==="medical"?"var(--err-l)":"var(--bg)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>
              {d.type==="care_plan"?"📋":d.type==="medical"?"🏥":"📝"}
            </div>
            <div><div style={{fontWeight:600,fontSize:13}}>{d.name}</div><div style={{fontSize:11,color:"var(--t2)"}}>{d.size} • {fmtD(d.date)}</div></div>
          </div>
          <div style={{display:"flex",gap:6}}>
            <span className="tag tag-bl">{d.type.replace("_"," ")}</span>
            <button className="btn btn-sm btn-s">📥 View</button>
          </div>
        </div>)}
      </div>
    </div>}

    {/* ═══ FEEDBACK ═══ */}
    {tab==="feedback"&& <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
        <h3 style={{fontFamily:"var(--fd)",fontSize:16}}>Satisfaction & Feedback</h3>
        <button className="btn btn-p btn-sm" onClick={()=>setShowSurvey(true)}>⭐ New Survey</button>
      </div>

      {/* Average Ratings */}
      {clSurveys.length>0&& <div className="card card-b">
        <h3 style={{fontSize:14,fontWeight:700,marginBottom:12}}>Your Average Ratings</h3>
        <div style={{display:"grid",gridTemplateColumns:"repeat(6,1fr)",gap:10}}>
          {["overall","punctuality","communication","skills","respect","reliability"].map(k=>{
            const avg=clSurveys.reduce((s,sv)=>s+(sv.ratings[k]||0),0)/clSurveys.length;
            return <div key={k} style={{textAlign:"center",padding:"12px 8px",background:"var(--bg)",borderRadius:"var(--rs)"}}>
              <div style={{fontFamily:"var(--fd)",fontSize:24,fontWeight:900,color:avg>=4.5?"var(--ok)":avg>=3.5?"var(--blue)":"var(--warn)"}}>{avg.toFixed(1)}</div>
              <div style={{fontSize:10,textTransform:"uppercase",color:"var(--t2)",fontWeight:600,marginTop:2}}>{k}</div>
              <div style={{fontSize:14,marginTop:2}}>{"★".repeat(Math.round(avg))+"☆".repeat(5-Math.round(avg))}</div>
            </div>;
          })}
        </div>
      </div>}

      {/* Survey History */}
      {clSurveys.map(sv=>{const cg=caregivers.find(c=>c.id===sv.caregiver);return <div key={sv.id} className="card card-b">
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
          <div><span style={{fontWeight:700,fontSize:14}}>Survey: {fmtD(sv.date)}</span><span style={{fontSize:12,color:"var(--t2)",marginLeft:8}}>for {cg?.name}</span></div>
          <div style={{fontFamily:"var(--fd)",fontSize:18,fontWeight:900,color:"var(--ok)"}}>{sv.ratings.overall}/5 ★</div>
        </div>
        <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:8}}>
          {Object.entries(sv.ratings).filter(([k])=>k!=="overall").map(([k,v])=> <span key={k} className={`tag ${v>=4?"tag-ok":v>=3?"tag-bl":"tag-wn"}`}>{k}: {v}/5</span>)}
        </div>
        {sv.comments&& <div style={{fontSize:13,lineHeight:1.6,padding:"10px 14px",background:"var(--bg)",borderRadius:"var(--rs)",fontStyle:"italic"}}>"{sv.comments}"</div>}
      </div>;})}

      {showSurvey&& <div className="modal-bg" onClick={()=>setShowSurvey(false)}><div className="modal" onClick={e=>e.stopPropagation()}>
        <div className="modal-h">⭐ Rate Your Care<button className="btn btn-sm btn-s" onClick={()=>setShowSurvey(false)}>✕</button></div>
        <SurveyForm clientId={cl.id} caregivers={assignedCGs} onSave={sv=>{setSurveys(p=>[{id:"SV"+uid(),clientId:cl.id,date:today(),...sv},...p]);setShowSurvey(false);}}/>
      </div></div>}
    </div>}
  </div>;
}

// ─── CLIENT PORTAL FORM COMPONENTS ──────────────────────────────────
function RequestForm({clientId,onSave}){
  const [f,sF]=useState({type:"Schedule Change",description:""});
  const types=["Schedule Change","Supply Request","Caregiver Feedback","Concern","Extra Visit","Other"];
  return <div className="modal-b">
    <div className="fi" style={{marginBottom:14}}><label>Request Type</label>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:6}}>
        {types.map(t=> <div key={t} onClick={()=>sF({...f,type:t})} style={{padding:"10px 8px",borderRadius:"var(--rs)",border:`1.5px solid ${f.type===t?"#111":"var(--bdr)"}`,background:f.type===t?"#111":"var(--card)",color:f.type===t?"#fff":"var(--text)",textAlign:"center",fontSize:12,fontWeight:600,cursor:"pointer",transition:".15s"}}>{t}</div>)}
      </div>
    </div>
    <div className="fi" style={{marginBottom:14}}><label>Details</label><textarea rows={4} value={f.description} onChange={e=>sF({...f,description:e.target.value})} placeholder="Describe your request..."/></div>
    <button className="btn btn-p" onClick={()=>f.description&&onSave(f)} disabled={!f.description}>Submit Request</button>
  </div>;
}

function SurveyForm({clientId,caregivers,onSave}){
  const [f,sF]=useState({caregiver:caregivers[0]?.id||"",ratings:{overall:5,punctuality:5,communication:5,skills:5,respect:5,reliability:5},comments:""});
  const setR=(k,v)=>sF(p=>({...p,ratings:{...p.ratings,[k]:v}}));
  const stars=(key)=> <div style={{display:"flex",gap:4}}>
    {[1,2,3,4,5].map(v=> <span key={v} onClick={()=>setR(key,v)} style={{fontSize:22,cursor:"pointer",color:v<=f.ratings[key]?"#F5A623":"var(--bdr)"}}>{v<=f.ratings[key]?"★":"☆"}</span>)}
  </div>;

  return <div className="modal-b">
    <div className="fi" style={{marginBottom:14}}><label>Caregiver</label>
      <select value={f.caregiver} onChange={e=>sF({...f,caregiver:e.target.value})}>
        {caregivers.map(cg=> <option key={cg.id} value={cg.id}>{cg.name}</option>)}
      </select>
    </div>
    {["overall","punctuality","communication","skills","respect","reliability"].map(k=> <div key={k} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:"1px solid var(--bdr)"}}>
      <span style={{fontSize:13,fontWeight:600,textTransform:"capitalize"}}>{k}</span>{stars(k)}
    </div>)}
    <div className="fi" style={{marginTop:14,marginBottom:14}}><label>Comments (optional)</label><textarea rows={3} value={f.comments} onChange={e=>sF({...f,comments:e.target.value})} placeholder="Tell us about your experience..."/></div>
    <button className="btn btn-p" onClick={()=>onSave(f)}>Submit Feedback</button>
  </div>;
}

function VitalForm({clientId,onSave}){
  const [f,sF]=useState({clientId,date:today(),bp:"",hr:"",temp:"",glucose:"",weight:"",notes:"",recordedBy:"Self"});
  return <div className="modal-b">
    <div className="fg" style={{marginBottom:12}}>
      <div className="fi"><label>Date</label><input type="date" value={f.date} onChange={e=>sF({...f,date:e.target.value})}/></div>
      <div className="fi"><label>Blood Pressure</label><input value={f.bp} onChange={e=>sF({...f,bp:e.target.value})} placeholder="e.g. 120/80"/></div>
      <div className="fi"><label>Heart Rate (bpm)</label><input type="number" value={f.hr} onChange={e=>sF({...f,hr:e.target.value})} placeholder="72"/></div>
      <div className="fi"><label>Temperature (°F)</label><input value={f.temp} onChange={e=>sF({...f,temp:e.target.value})} placeholder="98.6"/></div>
      <div className="fi"><label>Blood Glucose (mg/dL)</label><input type="number" value={f.glucose} onChange={e=>sF({...f,glucose:e.target.value})} placeholder="Optional"/></div>
      <div className="fi"><label>Weight (lbs)</label><input type="number" value={f.weight} onChange={e=>sF({...f,weight:e.target.value})} placeholder="Optional"/></div>
    </div>
    <div className="fi" style={{marginBottom:14}}><label>Notes</label><input value={f.notes} onChange={e=>sF({...f,notes:e.target.value})} placeholder="How are you feeling today?"/></div>
    <button className="btn btn-p" onClick={()=>f.bp&&onSave({...f,hr:Number(f.hr)||null,glucose:f.glucose?Number(f.glucose):null,weight:f.weight?Number(f.weight):null})}>Save Vitals</button>
  </div>;
}

// ═══════════════════════════════════════════════════════════════════════
// EVENTS & WELLNESS
// ═══════════════════════════════════════════════════════════════════════
function EventsPage({events,setEvents,clients}){
  const upcoming=events.filter(e=>new Date(e.date)>=now()).sort((a,b)=>new Date(a.date)-new Date(b.date));
  const past=events.filter(e=>new Date(e.date)<now());

  return <div>
    <div className="hdr"><div><h2>Events & Wellness</h2><div className="hdr-sub">Medical appointments, social activities, and AI-suggested events</div></div></div>

    <div className="ai-card">
      <h4><span className="pulse" style={{background:"#7B61FF"}}/>AI Event Suggestions</h4>
      <p>Based on client interests and local events: 🎬 Casablanca at Music Box Theatre (Mar 21) for Linda. ⚾ Cubs Opening Day Watch Party (Mar 26) for Steven. 🎵 Free CSO concert series starts in June for Becky. 🃏 Lincoln Park Bridge Club meets Wednesdays for Becky.</p>
    </div>

    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
      <div className="card"><div className="card-h"><h3>Upcoming ({upcoming.length})</h3></div>
        {upcoming.map(ev=>{const cl=clients.find(c=>c.id===ev.clientId);const isAI=ev.notes?.includes("AI-suggested");
          return <div key={ev.id} style={{padding:"12px 18px",borderBottom:"1px solid var(--bdr)"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
              <div><div style={{fontWeight:700,fontSize:14}}>{ev.title}</div><div style={{fontSize:12,color:"var(--t2)",marginTop:2}}>{cl?.name} • {fmtD(ev.date)}</div></div>
              <div style={{display:"flex",gap:4}}><span className={`tag ${ev.type==="medical"?"tag-er":"tag-bl"}`}>{ev.type}</span>{isAI&&<span className="tag tag-pu">AI</span>}</div>
            </div>
            {ev.notes&&<div style={{fontSize:12,color:"var(--t2)",marginTop:6,lineHeight:1.5}}>{ev.notes}</div>}
          </div>;})}
      </div>
      <div className="card"><div className="card-h"><h3>Client Wellness Overview</h3></div>
        {clients.map(cl=>{const clEvents=events.filter(e=>e.clientId===cl.id);const medical=clEvents.filter(e=>e.type==="medical").length;const social=clEvents.filter(e=>e.type==="social").length;
          return <div key={cl.id} style={{padding:"12px 18px",borderBottom:"1px solid var(--bdr)"}}>
            <div style={{fontWeight:700,fontSize:14,marginBottom:4}}>{cl.name}</div>
            <div style={{display:"flex",gap:8}}>
              <span className="tag tag-er">{medical} medical</span>
              <span className="tag tag-bl">{social} social</span>
            </div>
            <div style={{fontSize:11,color:"var(--t2)",marginTop:4}}>Interests: {cl.social.interests.slice(0,3).join(", ")}</div>
          </div>;})}
      </div>
    </div>
  </div>;
}

// ═══════════════════════════════════════════════════════════════════════
// FAMILY PORTAL
// ═══════════════════════════════════════════════════════════════════════
function FamilyPage({clients,familyMsgs,setFamilyMsgs,careNotes,incidents,events}){
  const [selClient,setSelClient]=useState("CL2");
  const [msg,setMsg]=useState("");
  const cl=clients.find(c=>c.id===selClient);
  const msgs=familyMsgs.filter(m=>m.clientId===selClient).sort((a,b)=>new Date(a.date)-new Date(b.date));
  const contacts=cl?.familyPortal?.contacts||[];
  const clNotes=careNotes.filter(n=>n.clientId===selClient).sort((a,b)=>new Date(b.date)-new Date(a.date)).slice(0,5);
  const clInc=incidents.filter(i=>i.clientId===selClient&&i.familyNotified);
  const clEvents=events.filter(e=>e.clientId===selClient&&new Date(e.date)>=now());

  const sendMsg=()=>{if(!msg.trim())return;setFamilyMsgs(p=>[...p,{id:"FM"+uid(),clientId:selClient,from:"CWIN Care Team",fromType:"caregiver",date:now().toISOString(),text:msg}]);setMsg("");};

  return <div>
    <div className="hdr"><div><h2>Family Portal</h2><div className="hdr-sub">Secure communication and updates for authorized family members</div></div>
      <select value={selClient} onChange={e=>setSelClient(e.target.value)} style={{padding:"8px 12px",borderRadius:"var(--rs)",border:"1px solid var(--bdr)",fontFamily:"var(--f)",fontWeight:600}}>
        {clients.filter(c=>c.familyPortal?.enabled).map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
      </select>
    </div>

    <div style={{display:"grid",gridTemplateColumns:"1fr 340px",gap:14}}>
      <div>
        {/* Authorized Contacts */}
        <div className="card"><div className="card-h"><h3>Authorized Family Contacts</h3></div>
          {contacts.map((fc,i)=><div key={i} style={{padding:"10px 18px",borderBottom:"1px solid var(--bdr)",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div><div style={{fontWeight:600,fontSize:13}}>{fc.name}</div><div style={{fontSize:11,color:"var(--t2)"}}>{fc.relation} • {fc.email}</div></div>
            <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>{fc.access.map(a=><span key={a} className="tag tag-bl" style={{fontSize:9}}>{a.replace(/_/g," ")}</span>)}</div>
          </div>)}
        </div>

        {/* Shared Care Notes */}
        <div className="card"><div className="card-h"><h3>Recent Care Updates</h3><span className="tag tag-ok">Shared</span></div>
          {clNotes.map(n=>{const cg=CAREGIVERS.find(c=>c.id===n.caregiverId);return <div key={n.id} style={{padding:"10px 18px",borderBottom:"1px solid var(--bdr)"}}>
            <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:"var(--t2)",marginBottom:3}}><span>{cg?.name}</span><span>{fmtD(n.date)}</span></div>
            <div style={{fontSize:13,lineHeight:1.5}}>{n.text}</div>
          </div>;})}
        </div>

        {/* Upcoming Events */}
        {clEvents.length>0&&<div className="card"><div className="card-h"><h3>Upcoming Events</h3></div>
          {clEvents.map(ev=><div key={ev.id} style={{padding:"10px 18px",borderBottom:"1px solid var(--bdr)",display:"flex",justifyContent:"space-between"}}>
            <div><div style={{fontWeight:600,fontSize:13}}>{ev.title}</div><div style={{fontSize:11,color:"var(--t2)"}}>{fmtD(ev.date)}</div></div>
            <span className={`tag ${ev.type==="medical"?"tag-er":"tag-bl"}`}>{ev.type}</span>
          </div>)}
        </div>}
      </div>

      {/* Message Thread */}
      <div className="card" style={{display:"flex",flexDirection:"column",maxHeight:"70vh"}}>
        <div className="card-h"><h3>💬 Messages</h3></div>
        <div style={{flex:1,overflow:"auto",padding:"14px 18px",display:"flex",flexDirection:"column",gap:4}}>
          {msgs.map(m=><div key={m.id} style={{display:"flex",flexDirection:"column",alignItems:m.fromType==="family"?"flex-end":"flex-start"}}>
            <div className="chat-meta">{m.from} • {fmtRel(m.date)}</div>
            <div className={`chat-bubble ${m.fromType==="family"?"chat-fam":"chat-cg"}`}>{m.text}</div>
          </div>)}
          {msgs.length===0&&<div className="empty">No messages yet</div>}
        </div>
        <div style={{padding:"10px 14px",borderTop:"1px solid var(--bdr)",display:"flex",gap:8}}>
          <input value={msg} onChange={e=>setMsg(e.target.value)} placeholder="Type a message to family..." style={{flex:1,padding:"8px 12px",border:"1px solid var(--bdr)",borderRadius:"var(--rs)",fontSize:13,fontFamily:"var(--f)"}} onKeyDown={e=>e.key==="Enter"&&sendMsg()}/>
          <button className="btn btn-p btn-sm" onClick={sendMsg} disabled={!msg.trim()}>Send</button>
        </div>
      </div>
    </div>
  </div>;
}

// ═══════════════════════════════════════════════════════════════════════
// TEAM
// ═══════════════════════════════════════════════════════════════════════
function TeamPage({caregivers,progress}){
  return <div>
    <div className="hdr"><div><h2>Team</h2><div className="hdr-sub">{caregivers.length} active caregivers</div></div></div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))",gap:14}}>
      {caregivers.map(cg=>{const done=(progress[cg.id]||[]).length;const pct=Math.round(done/TRAINING_MODULES.length*100);
        return <div key={cg.id} className="card card-b">
          <div style={{display:"flex",gap:14,alignItems:"center",marginBottom:14}}>
            <div className="avatar" style={{width:52,height:52,fontSize:18,background:"#111",color:"#fff"}}>{cg.avatar}</div>
            <div style={{flex:1}}><div style={{fontFamily:"var(--fd)",fontSize:17,fontWeight:400}}>{cg.name}</div><div style={{fontSize:12,color:"var(--t2)"}}>{cg.email}</div><div style={{fontSize:12,color:"var(--t2)"}}>{cg.phone}</div></div>
            <span className="tag tag-ok">Active</span>
          </div>
          <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:12}}>{cg.certs.map(c=><span key={c} className="tag tag-bl">{c}</span>)}</div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
            <span style={{fontSize:11,color:"var(--t2)"}}>Training: {done}/{TRAINING_MODULES.length}</span><span style={{fontSize:12,fontWeight:700}}>{pct}%</span>
          </div>
          <div className="progress-bar"><div className="progress-fill" style={{width:`${pct}%`,background:pct===100?"var(--ok)":"var(--blue)"}}/></div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginTop:14}}>
            <div style={{background:"var(--bg)",borderRadius:"var(--rs)",padding:10}}><div style={{fontSize:10,color:"var(--t2)",textTransform:"uppercase"}}>Rate</div><div style={{fontWeight:700}}>${cg.rate}/hr</div></div>
            <div style={{background:"var(--bg)",borderRadius:"var(--rs)",padding:10}}><div style={{fontSize:10,color:"var(--t2)",textTransform:"uppercase"}}>Since</div><div style={{fontWeight:700}}>{fmtD(cg.hireDate)}</div></div>
          </div>
        </div>;})}
    </div>
  </div>;
}

// ═══════════════════════════════════════════════════════════════════════
// RECONCILIATION CENTER — Drillable & Actionable
// ═══════════════════════════════════════════════════════════════════════
function ReconPage({entries,caregivers,clients}){
  const [sel,setSel]=useState(null);
  const [filter,setFilter]=useState("all");
  const filtered=filter==="all"?entries:entries.filter(e=>e.status===filter);
  const totalVar=entries.reduce((s,e)=>s+e.variance,0);
  const totalBilled=entries.reduce((s,e)=>s+e.billedAmount,0);
  const totalPaid=entries.reduce((s,e)=>s+e.paidAmount,0);
  const flagCount=entries.filter(e=>e.flags.length>0).length;
  const gpsMismatch=entries.filter(e=>!e.gpsMatch).length;

  return <div>
    <div className="hdr"><div><h2>Reconciliation Center</h2><div className="hdr-sub">Drill into time, GPS, and cost variances</div></div></div>

    <div className="sg">
      <div className="sc" style={{borderColor:totalVar<0?"var(--err)":"var(--ok)"}}><span className="sl">Time Variance</span><span className="sv" style={{color:totalVar<0?"var(--err)":"var(--ok)"}}>{totalVar.toFixed(1)}h</span><span className="ss">{totalVar<0?"Under":"Over"} scheduled</span></div>
      <div className="sc bl"><span className="sl">Total Billed</span><span className="sv">{$(totalBilled)}</span><span className="ss">{entries.length} entries</span></div>
      <div className="sc ok"><span className="sl">Total Paid</span><span className="sv">{$(totalPaid)}</span><span className="ss">Margin: {$(totalBilled-totalPaid)}</span></div>
      <div className="sc er"><span className="sl">Flags</span><span className="sv">{flagCount}</span><span className="ss">{gpsMismatch} GPS mismatches</span></div>
    </div>

    {/* AI Analysis */}
    <div className="ai-card">
      <h4><span className="pulse" style={{background:"var(--warn)"}}/>AI Reconciliation Analysis</h4>
      <p>
        {entries.filter(e=>e.flags.includes("LATE_ARRIVAL")).length} late arrivals detected.
        {gpsMismatch>0&&` ${gpsMismatch} GPS mismatch${gpsMismatch>1?"es":""} — clock-out location differs from client address.`}
        {entries.filter(e=>e.flags.includes("SHORT_SHIFT")).length>0&&` ${entries.filter(e=>e.flags.includes("SHORT_SHIFT")).length} shifts significantly shorter than scheduled.`}
        {entries.filter(e=>e.flags.includes("ADMIN_EDITED")).length>0&&` ${entries.filter(e=>e.flags.includes("ADMIN_EDITED")).length} entries manually edited by admin.`}
        {" "}Recommendation: Review flagged entries and confirm with caregivers before finalizing payroll.
      </p>
    </div>

    {/* Filter */}
    <div style={{display:"flex",gap:6,marginBottom:14}}>
      {["all","approved","review","flagged"].map(f=> <button key={f} className={`btn btn-sm ${filter===f?"btn-p":"btn-s"}`} onClick={()=>setFilter(f)}>{f==="all"?`All (${entries.length})`:f==="approved"?`Approved (${entries.filter(e=>e.status==="approved").length})`:f==="review"?`Review (${entries.filter(e=>e.status==="review").length})`:`Flagged (${entries.filter(e=>e.status==="flagged").length})`}</button>)}
    </div>

    <div className="card"><div className="tw"><table><thead><tr><th>Date</th><th>Caregiver</th><th>Client</th><th>Scheduled</th><th>Actual</th><th style={{textAlign:"right"}}>Variance</th><th>GPS</th><th>Flags</th><th style={{textAlign:"right"}}>Billed</th><th style={{textAlign:"right"}}>Paid</th><th style={{textAlign:"right"}}>Margin</th><th>Status</th><th></th></tr></thead><tbody>
      {filtered.sort((a,b)=>b.date.localeCompare(a.date)).map(e=>{const cg=caregivers.find(c=>c.id===e.caregiverId);const cl=clients.find(c=>c.id===e.clientId);
        return <tr key={e.id} style={{background:e.status==="flagged"?"var(--err-l)":e.status==="review"?"var(--warn-l)":""}}>
          <td style={{fontWeight:600}}>{fmtD(e.date)}</td>
          <td>{cg?.name}</td><td style={{fontWeight:600}}>{cl?.name}</td>
          <td style={{fontSize:11}}>{e.scheduled.start}-{e.scheduled.end} ({e.scheduled.hours}h)</td>
          <td style={{fontSize:11}}>{e.actual.clockIn}-{e.actual.clockOut} ({e.actual.hours}h)</td>
          <td style={{textAlign:"right",fontWeight:700,color:e.variance<0?"var(--err)":"var(--ok)"}}>{e.variance>0?"+":""}{e.variance.toFixed(1)}h</td>
          <td>{e.gpsMatch?<span className="tag tag-ok">Match</span>:<span className="tag tag-er">Mismatch</span>}</td>
          <td><div style={{display:"flex",gap:3,flexWrap:"wrap"}}>{e.flags.map((f,i)=> <span key={i} className="tag tag-wn" style={{fontSize:8}}>{f.replace(/_/g," ")}</span>)}{e.flags.length===0&&<span style={{color:"var(--t3)",fontSize:11}}>Clean</span>}</div></td>
          <td style={{textAlign:"right"}}>{$(e.billedAmount)}</td>
          <td style={{textAlign:"right"}}>{$(e.paidAmount)}</td>
          <td style={{textAlign:"right",fontWeight:700,color:"var(--ok)"}}>{$(e.margin)}</td>
          <td><span className={`tag ${e.status==="approved"?"tag-ok":e.status==="review"?"tag-wn":"tag-er"}`}>{e.status}</span></td>
          <td><button className="btn btn-sm btn-s" onClick={()=>setSel(e)}>Drill</button></td>
        </tr>;})}
    </tbody></table></div></div>

    {/* Drill-Down Modal */}
    {sel&& <div className="modal-bg" onClick={()=>setSel(null)}><div className="modal" style={{maxWidth:640}} onClick={e=>e.stopPropagation()}>
      <div className="modal-h">🔍 Entry Detail<button className="btn btn-sm btn-s" onClick={()=>setSel(null)}>✕</button></div>
      <div className="modal-b">
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:16}}>
          <div style={{padding:12,background:"var(--bg)",borderRadius:"var(--rs)"}}><div style={{fontSize:10,color:"var(--t2)",textTransform:"uppercase",fontWeight:600}}>Caregiver</div><div style={{fontWeight:700,fontSize:14}}>{caregivers.find(c=>c.id===sel.caregiverId)?.name}</div></div>
          <div style={{padding:12,background:"var(--bg)",borderRadius:"var(--rs)"}}><div style={{fontSize:10,color:"var(--t2)",textTransform:"uppercase",fontWeight:600}}>Client</div><div style={{fontWeight:700,fontSize:14}}>{clients.find(c=>c.id===sel.clientId)?.name}</div></div>
        </div>

        <h4 style={{fontSize:13,fontWeight:700,marginBottom:8}}>⏱ Time Analysis</h4>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:16}}>
          <div style={{padding:12,background:"var(--blue-l)",borderRadius:"var(--rs)",textAlign:"center"}}><div style={{fontSize:10,color:"var(--blue)"}}>Scheduled</div><div style={{fontFamily:"var(--fd)",fontSize:20,fontWeight:400}}>{sel.scheduled.hours}h</div><div style={{fontSize:11,color:"var(--t2)"}}>{sel.scheduled.start} - {sel.scheduled.end}</div></div>
          <div style={{padding:12,background:sel.variance<0?"var(--err-l)":"var(--ok-l)",borderRadius:"var(--rs)",textAlign:"center"}}><div style={{fontSize:10,color:sel.variance<0?"var(--err)":"var(--ok)"}}>Actual</div><div style={{fontFamily:"var(--fd)",fontSize:20,fontWeight:400}}>{sel.actual.hours}h</div><div style={{fontSize:11,color:"var(--t2)"}}>{sel.actual.clockIn} - {sel.actual.clockOut}</div></div>
          <div style={{padding:12,background:"var(--bg)",borderRadius:"var(--rs)",textAlign:"center"}}><div style={{fontSize:10,color:"var(--t2)"}}>Variance</div><div style={{fontFamily:"var(--fd)",fontSize:20,fontWeight:400,color:sel.variance<0?"var(--err)":"var(--ok)"}}>{sel.variance>0?"+":""}{sel.variance.toFixed(1)}h</div></div>
        </div>

        <h4 style={{fontSize:13,fontWeight:700,marginBottom:8}}>📍 GPS Verification</h4>
        <div style={{marginBottom:16}}>
          <div style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:"1px solid var(--bdr)"}}><span style={{color:"var(--t2)",fontSize:12}}>Clock-In Location</span><span style={{fontSize:12,fontWeight:600}}>📍 {sel.gpsIn}</span></div>
          <div style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:"1px solid var(--bdr)"}}><span style={{color:"var(--t2)",fontSize:12}}>Clock-Out Location</span><span style={{fontSize:12,fontWeight:600}}>📍 {sel.gpsOut}</span></div>
          <div style={{display:"flex",justifyContent:"space-between",padding:"8px 0"}}><span style={{color:"var(--t2)",fontSize:12}}>Geofence Match</span>{sel.gpsMatch?<span className="tag tag-ok">Verified</span>:<span className="tag tag-er">Mismatch — Investigate</span>}</div>
        </div>

        <h4 style={{fontSize:13,fontWeight:700,marginBottom:8}}>💰 Financial Impact</h4>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:16}}>
          <div style={{padding:12,background:"var(--bg)",borderRadius:"var(--rs)",textAlign:"center"}}><div style={{fontSize:10,color:"var(--t2)"}}>Billed</div><div style={{fontFamily:"var(--fd)",fontSize:18,fontWeight:900}}>{$(sel.billedAmount)}</div><div style={{fontSize:11,color:"var(--t2)"}}>{$(sel.billRate)}/hr</div></div>
          <div style={{padding:12,background:"var(--bg)",borderRadius:"var(--rs)",textAlign:"center"}}><div style={{fontSize:10,color:"var(--t2)"}}>Paid</div><div style={{fontFamily:"var(--fd)",fontSize:18,fontWeight:900}}>{$(sel.paidAmount)}</div><div style={{fontSize:11,color:"var(--t2)"}}>{$(sel.payRate)}/hr</div></div>
          <div style={{padding:12,background:"var(--ok-l)",borderRadius:"var(--rs)",textAlign:"center"}}><div style={{fontSize:10,color:"var(--ok)"}}>Margin</div><div style={{fontFamily:"var(--fd)",fontSize:18,fontWeight:900,color:"var(--ok)"}}>{$(sel.margin)}</div><div style={{fontSize:11,color:"var(--t2)"}}>{sel.billedAmount>0?((sel.margin/sel.billedAmount)*100).toFixed(0):0}%</div></div>
        </div>

        {sel.flags.length>0&& <><h4 style={{fontSize:13,fontWeight:700,marginBottom:8}}>⚠️ Flags & Actions</h4>
          {sel.flags.map((f,i)=> <div key={i} style={{padding:"10px 14px",background:"var(--warn-l)",borderRadius:"var(--rs)",marginBottom:6,fontSize:12,borderLeft:"3px solid var(--warn)"}}>
            <strong>{f.replace(/_/g," ")}:</strong> {f==="LATE_ARRIVAL"&&`Caregiver clocked in at ${sel.actual.clockIn} vs scheduled ${sel.scheduled.start}. Discuss with caregiver and document.`}
            {f==="SHORT_SHIFT"&&`Shift was ${Math.abs(sel.variance).toFixed(1)} hours shorter than scheduled. Verify with client if early departure was agreed.`}
            {f==="GPS_MISMATCH_OUT"&&`Clock-out location does not match client address. May indicate caregiver left area before clocking out.`}
            {f==="ADMIN_EDITED"&&`This entry was manually edited by an administrator. Original data may differ.`}
            {f==="EMERGENCY"&&`Emergency shift — non-standard hours. Verify billing applies.`}
          </div>)}</>}

        <div style={{display:"flex",gap:8,marginTop:16}}>
          <button className="btn btn-ok" style={{flex:1}}>✓ Approve</button>
          <button className="btn btn-er" style={{flex:1}}>✕ Reject</button>
          <button className="btn btn-s" style={{flex:1}}>📝 Add Note</button>
        </div>
      </div>
    </div></div>}
  </div>;
}

// ═══════════════════════════════════════════════════════════════════════
// RECRUITING — Caregiver & Client
// ═══════════════════════════════════════════════════════════════════════
function RecruitingPage({applicants,setApplicants,leads,setLeads}){
  const [tab,setTab]=useState("caregivers");
  const stages={new:"New",screening:"Screening",interview:"Interview",offer:"Offer Extended",hired:"Hired",rejected:"Rejected"};
  const clStages={new:"New Lead",inquiry:"Inquiry",assessment:"Assessment",proposal:"Proposal Sent",active:"Active Client",lost:"Lost"};

  return <div>
    <div className="hdr"><div><h2>Recruiting</h2><div className="hdr-sub">Caregiver pipeline & client acquisition</div></div></div>
    <div className="tab-row">
      <button className={`tab-btn ${tab==="caregivers"?"act":""}`} onClick={()=>setTab("caregivers")}>👩‍⚕️ Caregiver Pipeline ({applicants.length})</button>
      <button className={`tab-btn ${tab==="clients"?"act":""}`} onClick={()=>setTab("clients")}>🏠 Client Leads ({leads.length})</button>
    </div>

    {tab==="caregivers"&& <div>
      {/* Pipeline Stats */}
      <div className="sg">
        {["new","screening","interview","offer"].map(s=> <div key={s} className={`sc ${s==="offer"?"ok":s==="new"?"bl":"wn"}`}><span className="sl">{stages[s]}</span><span className="sv">{applicants.filter(a=>a.status===s).length}</span></div>)}
      </div>

      {/* Applicant Cards */}
      {applicants.map(ap=> <div key={ap.id} className="card card-b" style={{borderLeft:`4px solid ${ap.status==="offer"?"var(--ok)":ap.status==="interview"?"var(--blue)":ap.status==="new"?"var(--purple)":"var(--warn)"}`}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
          <div><div style={{fontFamily:"var(--fd)",fontSize:16,fontWeight:400}}>{ap.name}</div><div style={{fontSize:12,color:"var(--t2)"}}>{ap.email} • {ap.phone}</div></div>
          <div style={{display:"flex",gap:4}}><span className={`tag ${ap.status==="offer"?"tag-ok":ap.status==="interview"?"tag-bl":"tag-wn"}`}>{stages[ap.status]}</span>
            {ap.bgCheck==="passed"&&<span className="tag tag-ok">BG ✓</span>}{ap.bgCheck==="pending"&&<span className="tag tag-wn">BG Pending</span>}</div>
        </div>
        <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:8}}>{ap.certs.map(c=> <span key={c} className="tag tag-bl">{c}</span>)}</div>
        <div style={{fontSize:12,color:"var(--t2)",lineHeight:1.6,marginBottom:8}}>
          <div><strong>Experience:</strong> {ap.experience}</div>
          <div><strong>Availability:</strong> {ap.availability} • Areas: {ap.preferredAreas.join(", ")}</div>
          <div><strong>Source:</strong> {ap.source} • Applied: {fmtD(ap.appliedDate)}</div>
          {ap.notes&& <div style={{marginTop:4,padding:"6px 10px",background:"var(--bg)",borderRadius:"var(--rs)"}}>{ap.notes}</div>}
        </div>
        <div style={{display:"flex",gap:6}}>
          {ap.status==="new"&&<button className="btn btn-sm btn-bl" onClick={()=>setApplicants(p=>p.map(a=>a.id===ap.id?{...a,status:"screening"}:a))}>Start Screening</button>}
          {ap.status==="screening"&&<button className="btn btn-sm btn-bl" onClick={()=>setApplicants(p=>p.map(a=>a.id===ap.id?{...a,status:"interview"}:a))}>Schedule Interview</button>}
          {ap.status==="interview"&&<button className="btn btn-sm btn-ok" onClick={()=>setApplicants(p=>p.map(a=>a.id===ap.id?{...a,status:"offer"}:a))}>Extend Offer</button>}
          {ap.status==="offer"&&<button className="btn btn-sm btn-ok" onClick={()=>setApplicants(p=>p.map(a=>a.id===ap.id?{...a,status:"hired"}:a))}>Mark Hired</button>}
          <button className="btn btn-sm btn-s">📝 Notes</button>
        </div>
      </div>)}
    </div>}

    {tab==="clients"&& <div>
      <div className="sg">
        {["new","inquiry","assessment","proposal"].map(s=> <div key={s} className={`sc ${s==="proposal"?"ok":s==="new"?"pu":"bl"}`}><span className="sl">{clStages[s]}</span><span className="sv">{leads.filter(l=>l.status===s).length}</span></div>)}
      </div>

      {leads.map(ld=> <div key={ld.id} className="card card-b" style={{borderLeft:`4px solid ${ld.urgency==="high"?"var(--err)":"var(--warn)"}`}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
          <div><div style={{fontFamily:"var(--fd)",fontSize:16,fontWeight:400}}>{ld.name}</div><div style={{fontSize:12,color:"var(--t2)"}}>Age {ld.age} • {ld.phone}</div></div>
          <div style={{display:"flex",gap:4}}><span className={`tag ${ld.status==="proposal"?"tag-ok":ld.status==="assessment"?"tag-bl":"tag-wn"}`}>{clStages[ld.status]}</span>
            <span className={`tag ${ld.urgency==="high"?"tag-er":"tag-wn"}`}>{ld.urgency} urgency</span></div>
        </div>
        <div style={{fontSize:12,color:"var(--t2)",lineHeight:1.7}}>
          <div><strong>Referral:</strong> {ld.referralSource}</div>
          <div><strong>Needs:</strong> {ld.needs}</div>
          <div><strong>Hours:</strong> {ld.hoursNeeded}</div>
          {ld.assessmentDate&& <div><strong>Assessment:</strong> {fmtD(ld.assessmentDate)}</div>}
          {ld.notes&& <div style={{marginTop:4,padding:"6px 10px",background:"var(--bg)",borderRadius:"var(--rs)"}}>{ld.notes}</div>}
        </div>
        <div style={{display:"flex",gap:6,marginTop:8}}>
          {ld.status==="new"&&<button className="btn btn-sm btn-bl" onClick={()=>setLeads(p=>p.map(l=>l.id===ld.id?{...l,status:"inquiry"}:l))}>Contact</button>}
          {ld.status==="inquiry"&&<button className="btn btn-sm btn-bl" onClick={()=>setLeads(p=>p.map(l=>l.id===ld.id?{...l,status:"assessment"}:l))}>Schedule Assessment</button>}
          {ld.status==="assessment"&&<button className="btn btn-sm btn-ok" onClick={()=>setLeads(p=>p.map(l=>l.id===ld.id?{...l,status:"proposal"}:l))}>Send Proposal</button>}
          {ld.status==="proposal"&&<button className="btn btn-sm btn-ok" onClick={()=>setLeads(p=>p.map(l=>l.id===ld.id?{...l,status:"active"}:l))}>Convert to Client</button>}
        </div>
      </div>)}
    </div>}
  </div>;
}

// ═══════════════════════════════════════════════════════════════════════
// COMPLIANCE CENTER
// ═══════════════════════════════════════════════════════════════════════
function CompliancePage({items,setItems,caregivers,clients}){
  const overdue=items.filter(i=>i.status==="overdue");
  const expiring=items.filter(i=>i.status==="expiring_soon");
  const current=items.filter(i=>i.status==="current");

  return <div>
    <div className="hdr"><div><h2>Compliance Center</h2><div className="hdr-sub">Certifications, agreements, and regulatory tracking</div></div></div>

    <div className="sg">
      <div className="sc er"><span className="sl">Overdue</span><span className="sv">{overdue.length}</span><span className="ss">Immediate action needed</span></div>
      <div className="sc wn"><span className="sl">Expiring Soon</span><span className="sv">{expiring.length}</span><span className="ss">Within 30 days</span></div>
      <div className="sc ok"><span className="sl">Current</span><span className="sv">{current.length}</span><span className="ss">Fully compliant</span></div>
      <div className="sc bl"><span className="sl">Total Items</span><span className="sv">{items.length}</span><span className="ss">Being tracked</span></div>
    </div>

    {overdue.length>0&& <div className="ai-card" style={{background:"linear-gradient(135deg,#3d0000,#1a0000)"}}>
      <h4><span className="pulse" style={{background:"var(--err)"}}/>Compliance Alerts</h4>
      <p>{overdue.map(i=>`⚠️ ${i.type} for ${i.entity} is OVERDUE (due ${fmtD(i.dueDate)}). `).join("")}Take immediate action to maintain regulatory compliance.</p>
    </div>}

    {/* Overdue */}
    {overdue.length>0&& <div className="card"><div className="card-h" style={{background:"var(--err-l)"}}><h3 style={{color:"var(--err)"}}>⚠️ Overdue ({overdue.length})</h3></div>
      {overdue.map(item=> <div key={item.id} style={{padding:"12px 18px",borderBottom:"1px solid var(--bdr)",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div><div style={{fontWeight:700,fontSize:14}}>{item.type}</div><div style={{fontSize:12,color:"var(--t2)"}}>{item.entity} ({item.entityType}) • Due: {fmtD(item.dueDate)}</div>{item.notes&& <div style={{fontSize:11,color:"var(--t2)",marginTop:2}}>{item.notes}</div>}</div>
        <div style={{display:"flex",gap:6}}><span className="tag tag-er">OVERDUE</span><button className="btn btn-sm btn-ok" onClick={()=>setItems(p=>p.map(i=>i.id===item.id?{...i,status:"current",dueDate:"2027-"+item.dueDate.slice(5)}:i))}>Mark Resolved</button></div>
      </div>)}
    </div>}

    {/* Expiring */}
    {expiring.length>0&& <div className="card"><div className="card-h" style={{background:"var(--warn-l)"}}><h3>⏰ Expiring Soon ({expiring.length})</h3></div>
      {expiring.map(item=> <div key={item.id} style={{padding:"12px 18px",borderBottom:"1px solid var(--bdr)",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div><div style={{fontWeight:700,fontSize:14}}>{item.type}</div><div style={{fontSize:12,color:"var(--t2)"}}>{item.entity} ({item.entityType}) • Due: {fmtD(item.dueDate)}</div>{item.notes&& <div style={{fontSize:11,color:"var(--t2)",marginTop:2}}>{item.notes}</div>}</div>
        <div style={{display:"flex",gap:6}}><span className="tag tag-wn">EXPIRING</span><button className="btn btn-sm btn-ok" onClick={()=>setItems(p=>p.map(i=>i.id===item.id?{...i,status:"current",dueDate:"2027-"+item.dueDate.slice(5)}:i))}>Renew</button></div>
      </div>)}
    </div>}

    {/* Current */}
    <div className="card"><div className="card-h"><h3>✅ Current ({current.length})</h3></div>
      <div className="tw"><table><thead><tr><th>Type</th><th>Entity</th><th>Category</th><th>Due Date</th><th>Notes</th><th>Status</th></tr></thead><tbody>
        {current.map(item=> <tr key={item.id}>
          <td style={{fontWeight:600}}>{item.type}</td><td>{item.entity}</td>
          <td><span className={`tag ${item.entityType==="caregiver"?"tag-bl":item.entityType==="client"?"tag-pu":"tag-wn"}`}>{item.entityType}</span></td>
          <td>{fmtD(item.dueDate)}</td><td style={{fontSize:12,color:"var(--t2)"}}>{item.notes}</td>
          <td><span className="tag tag-ok">Current</span></td>
        </tr>)}
      </tbody></table></div>
    </div>
  </div>;
}

// ═══════════════════════════════════════════════════════════════════════
// MARKETING
// ═══════════════════════════════════════════════════════════════════════
function MarketingPage({campaigns,setCampaigns,leads,applicants}){
  const totalBudget=campaigns.reduce((s,c)=>s+c.budget,0);
  const totalSpent=campaigns.reduce((s,c)=>s+c.spent,0);
  const totalLeads=campaigns.reduce((s,c)=>s+c.leads,0);
  const totalConv=campaigns.reduce((s,c)=>s+c.conversions,0);
  const avgCPL=totalLeads>0?(totalSpent/totalLeads):0;

  return <div>
    <div className="hdr"><div><h2>Marketing</h2><div className="hdr-sub">Campaigns, leads, and growth analytics</div></div></div>

    <div className="sg">
      <div className="sc bl"><span className="sl">Total Budget</span><span className="sv">{$(totalBudget)}</span><span className="ss">{$(totalSpent)} spent ({totalBudget>0?((totalSpent/totalBudget)*100).toFixed(0):0}%)</span></div>
      <div className="sc pu"><span className="sl">Total Leads</span><span className="sv">{totalLeads}</span><span className="ss">{totalConv} converted</span></div>
      <div className="sc ok"><span className="sl">Conversion Rate</span><span className="sv">{totalLeads>0?((totalConv/totalLeads)*100).toFixed(0):0}%</span><span className="ss">{totalConv} of {totalLeads}</span></div>
      <div className="sc wn"><span className="sl">Avg Cost/Lead</span><span className="sv">{$(avgCPL)}</span><span className="ss">Across all channels</span></div>
    </div>

    <div className="ai-card">
      <h4><span className="pulse" style={{background:"var(--ok)"}}/>Marketing Intelligence</h4>
      <p>
        Hospital discharge partnerships are your best channel: {campaigns.find(c=>c.channel==="Direct Outreach")?.conversions||0} conversions at $0 cost per lead.
        Facebook/Instagram generating {campaigns.find(c=>c.channel==="Facebook/Instagram")?.leads||0} leads at {$(campaigns.find(c=>c.channel==="Facebook/Instagram")?.cpl||0)} CPL.
        Referral program yielding high-quality leads but at higher cost. Recommend increasing hospital outreach budget and launching Google Ads for "home care near me" searches.
      </p>
    </div>

    {/* Campaign Cards */}
    {campaigns.map(c=> <div key={c.id} className="card card-b">
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
        <div><div style={{fontFamily:"var(--fd)",fontSize:16,fontWeight:400}}>{c.name}</div><div style={{fontSize:12,color:"var(--t2)"}}>{c.channel} • {fmtD(c.startDate)} — {fmtD(c.endDate)}</div></div>
        <span className={`tag ${c.status==="active"?"tag-ok":"tag-wn"}`}>{c.status}</span>
      </div>

      {/* Budget Bar */}
      {c.budget>0&& <div style={{marginBottom:10}}>
        <div style={{display:"flex",justifyContent:"space-between",fontSize:11,color:"var(--t2)",marginBottom:4}}><span>Budget: {$(c.budget)}</span><span>Spent: {$(c.spent)} ({((c.spent/c.budget)*100).toFixed(0)}%)</span></div>
        <div className="progress-bar"><div className="progress-fill" style={{width:`${Math.min((c.spent/c.budget)*100,100)}%`,background:c.spent>c.budget?"var(--err)":"var(--blue)"}}/></div>
      </div>}

      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8}}>
        <div style={{padding:10,background:"var(--bg)",borderRadius:"var(--rs)",textAlign:"center"}}><div style={{fontSize:10,color:"var(--t2)",textTransform:"uppercase"}}>Leads</div><div style={{fontFamily:"var(--fd)",fontWeight:900,fontSize:18}}>{c.leads}</div></div>
        <div style={{padding:10,background:"var(--bg)",borderRadius:"var(--rs)",textAlign:"center"}}><div style={{fontSize:10,color:"var(--t2)",textTransform:"uppercase"}}>Converted</div><div style={{fontFamily:"var(--fd)",fontWeight:900,fontSize:18,color:"var(--ok)"}}>{c.conversions}</div></div>
        <div style={{padding:10,background:"var(--bg)",borderRadius:"var(--rs)",textAlign:"center"}}><div style={{fontSize:10,color:"var(--t2)",textTransform:"uppercase"}}>Conv %</div><div style={{fontFamily:"var(--fd)",fontWeight:900,fontSize:18}}>{c.leads>0?((c.conversions/c.leads)*100).toFixed(0):0}%</div></div>
        <div style={{padding:10,background:"var(--bg)",borderRadius:"var(--rs)",textAlign:"center"}}><div style={{fontSize:10,color:"var(--t2)",textTransform:"uppercase"}}>CPL</div><div style={{fontFamily:"var(--fd)",fontWeight:900,fontSize:18}}>{$(c.cpl)}</div></div>
      </div>
      {c.notes&& <div style={{fontSize:12,color:"var(--t2)",marginTop:8,padding:"6px 10px",background:"var(--bg)",borderRadius:"var(--rs)"}}>{c.notes}</div>}
    </div>)}

    {/* Pipeline Summary */}
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
      <div className="card"><div className="card-h"><h3>Caregiver Pipeline</h3></div><div className="card-b">
        <div style={{fontSize:13,lineHeight:2}}>
          <div><strong>{applicants.filter(a=>a.status==="new").length}</strong> new applicants</div>
          <div><strong>{applicants.filter(a=>a.status==="screening").length}</strong> in screening</div>
          <div><strong>{applicants.filter(a=>a.status==="interview").length}</strong> interviewing</div>
          <div><strong>{applicants.filter(a=>a.status==="offer").length}</strong> offers pending</div>
        </div>
      </div></div>
      <div className="card"><div className="card-h"><h3>Client Pipeline</h3></div><div className="card-b">
        <div style={{fontSize:13,lineHeight:2}}>
          <div><strong>{leads.filter(l=>l.status==="new").length}</strong> new leads</div>
          <div><strong>{leads.filter(l=>l.status==="inquiry").length}</strong> inquiries</div>
          <div><strong>{leads.filter(l=>l.status==="assessment").length}</strong> assessments scheduled</div>
          <div><strong>{leads.filter(l=>l.status==="proposal").length}</strong> proposals out</div>
        </div>
      </div></div>
    </div>
  </div>;
}
