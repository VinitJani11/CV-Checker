export const SKILL_GROUPS = {
  programming: ['javascript','typescript','python','java','c#','c++','php','ruby','go','rust','html','css','react','angular','vue','node.js'],
  data: ['sql','excel','power bi','tableau','pandas','numpy','snowflake','etl','data analysis','data visualisation','data visualization','machine learning'],
  cloud: ['aws','azure','google cloud','gcp','docker','kubernetes','terraform'],
  delivery: ['agile','scrum','jira','kanban','project management','risk management','change management'],
  business: ['stakeholder management','business analysis','requirements gathering','reporting','process improvement','customer service','budget management'],
  people: ['communication','leadership','teamwork','problem solving','time management','attention to detail','collaboration'],
  office: ['microsoft office','word','powerpoint','outlook','sharepoint','salesforce','sap']
};

export const ALIASES = {
  'javascript': ['java script','js'], 'typescript': ['ts'], 'node.js': ['nodejs','node js'],
  'power bi': ['powerbi','power-bi'], 'microsoft excel': ['ms excel','excel'],
  'google cloud': ['gcp','google cloud platform'], 'aws': ['amazon web services'],
  'azure': ['microsoft azure'], 'postgresql': ['postgres'], 'sql': ['structured query language'],
  'c#': ['c sharp'], 'c++': ['cpp'], 'project management': ['project delivery'],
  'stakeholder management': ['stakeholder engagement','stakeholder relations'],
  'requirements gathering': ['requirements elicitation','business requirements'],
  'data visualisation': ['data visualization','dashboarding','dashboards'],
  'machine learning': ['ml'], 'artificial intelligence': ['ai'],
  'continuous integration': ['ci/cd','continuous delivery'], 'customer relationship management': ['crm']
};

export const SEMANTIC_GROUPS = [
  ['collaborate','collaboration','partnered','worked closely','cross-functional','teamwork'],
  ['manage','managed','led','coordinated','oversaw','supervised'],
  ['analyse','analyze','analysed','analyzed','assess','evaluate','investigate'],
  ['analysis','analyst','analytics','analytical'],
  ['create','created','built','developed','designed','produced','prepared'],
  ['improve','improved','optimised','optimized','streamlined','enhanced'],
  ['communicate','presented','reported','liaised','engaged'],
  ['customer','client','user','stakeholder'],
  ['dashboard','visualisation','visualization','reporting'],
  ['automate','automated','scripting','workflow'],
  ['plan','planned','roadmap','schedule','prioritise','prioritize']
];

export const STOPWORDS = new Set(('a an and are as at be been being by can could did do does for from had has have having he her here hers herself him himself his how i if in into is it its itself may might more most must my no nor not of on once only or other our ours ourselves out over own same she should so some such than that the their theirs them themselves then there these they this those through to too under until up very was we were what when where which while who whom why will with would you your yours experience experienced ability abilities knowledge strong excellent good including using use used work working role candidate candidates required requirements preferred essential desirable responsibility responsibilities').split(/\s+/));

export const STANDARD_SECTIONS = {
  summary: ['summary','professional summary','profile','personal profile','career summary','objective'],
  experience: ['experience','work experience','employment history','career history','professional experience'],
  skills: ['skills','key skills','core skills','technical skills','competencies'],
  education: ['education','qualifications','academic background'],
  certifications: ['certifications','certificates','professional development'],
  projects: ['projects','key projects','selected projects'],
  achievements: ['achievements','awards','accomplishments']
};

export const ACTION_VERBS = ['achieved','analysed','automated','built','coordinated','created','delivered','designed','developed','implemented','improved','increased','led','managed','optimised','prepared','reduced','resolved','streamlined','supported'];
