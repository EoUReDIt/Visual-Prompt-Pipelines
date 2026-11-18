import { SpellingIssue, SuggestedFieldPreset } from '../types/ai';
import { BlockType } from '../types/pipeline';

// Curated field suggestions organized by BlockType
export const BLOCK_FIELD_SUGGESTIONS: SuggestedFieldPreset[] = [
  // Overarching Request
  {
    kind: 'text',
    name: 'Primary Objective',
    starterContent: 'Describe the main deliverable and intended outcome in one sentence.',
    blockTypes: ['Overarching Request'],
  },
  {
    kind: 'text',
    name: 'Target Audience',
    starterContent: 'Product launch teaser for mobile-first social viewers.',
    blockTypes: ['Overarching Request'],
  },
  {
    kind: 'text',
    name: 'Success Criteria',
    starterContent: 'Clear subject readability, consistent lighting, and smooth motion.',
    blockTypes: ['Overarching Request'],
  },

  // Model & Task
  {
    kind: 'text',
    name: 'Target Model',
    starterContent: 'Video Generation v2',
    blockTypes: ['Model & Task'],
  },
  {
    kind: 'text',
    name: 'Aspect Ratio & Resolution',
    starterContent: '16:9 · 1080p · 24fps',
    blockTypes: ['Model & Task', 'Output Format'],
  },
  {
    kind: 'text',
    name: 'Clip Duration',
    starterContent: '6 seconds',
    blockTypes: ['Model & Task'],
  },
  {
    kind: 'text',
    name: 'Camera Framerate',
    starterContent: '24fps cinematic shutter',
    blockTypes: ['Model & Task', 'Concept & Scene'],
  },

  // Concept & Scene
  {
    kind: 'text',
    name: 'Camera Angle & Movement',
    starterContent: 'Slow dolly push-in at eye level with shallow depth of field.',
    blockTypes: ['Concept & Scene'],
  },
  {
    kind: 'text',
    name: 'Lighting Mood',
    starterContent: 'Soft diffused twilight key light with warm streetlamp rim highlights.',
    blockTypes: ['Concept & Scene'],
  },
  {
    kind: 'text',
    name: 'Color Palette',
    starterContent: 'Muted slate blues contrasted against warm amber reflections.',
    blockTypes: ['Concept & Scene', 'Subject Details'],
  },
  {
    kind: 'text',
    name: 'Atmosphere & Weather',
    starterContent: 'Light mist over wet asphalt with subtle rain streaks.',
    blockTypes: ['Concept & Scene'],
  },

  // Subject Details
  {
    kind: 'text',
    name: 'Subject Outfit',
    starterContent: 'Tailored charcoal wool coat, crisp white shirt, minimal silver watch.',
    blockTypes: ['Subject Details', 'Concept & Scene'],
  },
  {
    kind: 'text',
    name: 'Subject Action & Pacing',
    starterContent: 'Steps calmly toward camera and glances down at wristwatch.',
    blockTypes: ['Subject Details', 'Concept & Scene'],
  },
  {
    kind: 'text',
    name: 'Expression & Posture',
    starterContent: 'Composed, natural posture with subtle head turn toward light.',
    blockTypes: ['Subject Details'],
  },
  {
    kind: 'text',
    name: 'Continuity Checklist',
    starterContent: 'Flag wardrobe, prop placement, or lighting temperature shifts between cuts.',
    blockTypes: ['Subject Details'],
  },

  // Reference Photos
  {
    kind: 'image',
    photoRole: 'Subject Ref',
    name: 'Subject Identity Ref',
    starterContent: 'Preserve facial features, garment texture, and primary prop details.',
    blockTypes: ['Reference Photos', 'Subject Details'],
  },
  {
    kind: 'image',
    photoRole: 'Scene / Environment Ref',
    name: 'Environment Backdrop Ref',
    starterContent: 'Use architectural layout and background depth from this photo.',
    blockTypes: ['Reference Photos', 'Concept & Scene'],
  },
  {
    kind: 'image',
    photoRole: 'Analysis-Only Ref',
    name: 'Lighting & Grade Study',
    starterContent: 'Analyze color grading and shadow falloff only — do not copy objects.',
    blockTypes: ['Reference Photos'],
  },
  {
    kind: 'image',
    photoRole: 'Comparison Item',
    name: 'Reference Benchmark Item',
    starterContent: 'Use as baseline sample for visual alignment and finish comparison.',
    blockTypes: ['Reference Photos'],
  },

  // Constraints
  {
    kind: 'positive',
    name: 'Framing & Sharpness',
    starterContent: 'Keep primary subject in crisp focus with clean edge separation.',
    blockTypes: ['Constraints'],
  },
  {
    kind: 'positive',
    name: 'Motion Consistency',
    starterContent: 'Maintain steady camera velocity and natural fabric physics.',
    blockTypes: ['Constraints'],
  },
  {
    kind: 'negative',
    name: 'Artifact Exclusions',
    starterContent: 'No warped hands, no duplicate limbs, no flickering background text.',
    blockTypes: ['Constraints'],
  },
  {
    kind: 'negative',
    name: 'Style Exclusions',
    starterContent: 'Avoid artificial lens flare, oversaturated neon, or sudden jump cuts.',
    blockTypes: ['Constraints'],
  },

  // Audio / Voiceover
  {
    kind: 'text',
    name: 'Voiceover Script',
    starterContent: 'Calm, understated narration matching a 6-second pacing beat.',
    blockTypes: ['Audio / Voiceover'],
  },
  {
    kind: 'text',
    name: 'Ambient Soundscape',
    starterContent: 'Distant city traffic, light rain hiss, subtle mechanical watch tick.',
    blockTypes: ['Audio / Voiceover'],
  },

  // Output Format
  {
    kind: 'text',
    name: 'Response Structure',
    starterContent: 'Structured Markdown sections with exact MM:SS timestamps.',
    blockTypes: ['Output Format', 'Constraints'],
  },
  {
    kind: 'text',
    name: 'Pass / Fail Criteria',
    starterContent: 'Summarize findings in a comparison table with a clear verdict.',
    blockTypes: ['Output Format'],
  },

  // Custom Section
  {
    kind: 'text',
    name: 'Evaluation Notes',
    starterContent: 'Additional context or edge cases for the model to account for.',
    blockTypes: ['Custom Section'],
  },
  {
    kind: 'positive',
    name: 'Must Include',
    starterContent: 'Explicitly preserve key details across every step.',
    blockTypes: ['Custom Section'],
  },
  {
    kind: 'negative',
    name: 'Avoid',
    starterContent: 'Do not infer unverified measurements or add unrequested overlays.',
    blockTypes: ['Custom Section'],
  },
];

export function getSuggestedFieldsForBlock(
  blockType: BlockType,
  existingFieldNames: string[]
): SuggestedFieldPreset[] {
  const normalizedExisting = new Set(
    existingFieldNames.map((n) => n.trim().toLowerCase()).filter(Boolean)
  );
  const matching = BLOCK_FIELD_SUGGESTIONS.filter(
    (item) =>
      item.blockTypes.includes(blockType) &&
      !normalizedExisting.has(item.name.toLowerCase())
  );
  if (matching.length > 0) return matching.slice(0, 5);

  return BLOCK_FIELD_SUGGESTIONS.filter(
    (item) => !normalizedExisting.has(item.name.toLowerCase())
  ).slice(0, 4);
}

// Fast local field-name & prompt phrase auto-completion
const FIELD_NAME_PHRASES = [
  'Subject Outfit',
  'Subject Action',
  'Subject Pose & Framing',
  'Scene Environment',
  'Lighting Mood',
  'Camera Movement',
  'Camera Angle & Lens',
  'Color Palette',
  'Aspect Ratio & Duration',
  'Target Model',
  'Overarching Goal',
  'Analysis Focus',
  'Continuity Errors',
  'Hook Effectiveness',
  'Comparison Criteria',
  'Color & Surface Finish',
  'Seams & Proportions',
  'Must Include',
  'Avoid / Exclude',
  'Output Structure',
  'Voiceover Script',
  'Ambient Soundscape',
  'Subject Identity Ref',
  'Scene Backdrop Ref',
  'Analysis-Only Style Ref',
];

const CONTENT_PHRASES = [
  'Shallow depth of field with natural bokeh and crisp subject focus.',
  'Smooth 24fps dolly push-in with steady camera velocity.',
  'Analyze color palette and lighting contrast only — do not copy objects.',
  'Preserve metallic bezel texture, dial numerals, and natural reflections.',
  'Neon-lit city street at dusk with wet pavement reflections.',
  'No warped hands, no text overlays, and no sudden jump cuts.',
  'List findings chronologically with exact MM:SS timestamps and actionable fixes.',
  'Compare surface texture, sheen, alignment, and color accuracy side-by-side.',
  'Charcoal wool overcoat, crisp white collar, and dark leather gloves.',
  'Soft diffused side lighting with subtle rim highlight separation.',
];

export function getFieldNameCompletions(query: string): string[] {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) return [];
  return FIELD_NAME_PHRASES.filter(
    (phrase) =>
      phrase.toLowerCase().startsWith(trimmed) &&
      phrase.toLowerCase() !== trimmed
  ).slice(0, 4);
}

export function getContentAutoSuggestions(text: string): string[] {
  const trimmed = text.trim();
  if (trimmed.length < 3) return [];
  const lower = trimmed.toLowerCase();

  // Check last fragment after sentence or comma for natural completion
  const lastSegment = lower.split(/[.\n,;]+/).pop()?.trim() || '';
  const words = lastSegment.split(/\s+/).filter(Boolean);
  const lastWord = words[words.length - 1] || '';

  const results: string[] = [];

  for (const phrase of CONTENT_PHRASES) {
    const pLower = phrase.toLowerCase();
    if (pLower.startsWith(lower) && pLower !== lower) {
      results.push(phrase);
    } else if (lastSegment.length >= 4 && pLower.includes(lastSegment) && !lower.includes(pLower)) {
      results.push(phrase);
    }
  }

  if (results.length < 3 && lastWord.length >= 3) {
    const domainSuffixes: Record<string, string[]> = {
      shallow: ['depth of field with soft background bokeh'],
      smooth: ['24fps dolly push-in', 'camera tracking motion'],
      lighting: ['temperature consistency', 'and soft shadow falloff'],
      contrast: ['only without copying layout or objects'],
      preserve: ['original proportions and surface texture'],
      compare: ['material finish, stitching, and alignment'],
      avoid: ['warped fingers, flicker, and text overlays'],
      wet: ['pavement reflections under dusk streetlamps'],
      cinematic: ['24fps framing with natural film grain'],
      timestamp: ['markers in MM:SS format'],
    };

    for (const [trigger, completions] of Object.entries(domainSuffixes)) {
      if (trigger.startsWith(lastWord)) {
        for (const comp of completions) {
          const full =
            lastWord === trigger
              ? `${trimmed} ${comp}`
              : `${trimmed.slice(0, trimmed.length - lastWord.length)}${trigger} ${comp}`;
          if (!results.includes(full)) results.push(full);
        }
      }
    }
  }

  return results.slice(0, 3);
}

// Fast English + Domain Spell Checker
const COMMON_TYPOS: Record<string, string> = {
  teh: 'the',
  adn: 'and',
  wiht: 'with',
  taht: 'that',
  form: 'from',
  enviroment: 'environment',
  enviornment: 'environment',
  ligting: 'lighting',
  lighing: 'lighting',
  cinamtic: 'cinematic',
  cinemtaic: 'cinematic',
  refelctions: 'reflections',
  reflectionsn: 'reflections',
  silhoutte: 'silhouette',
  silhouete: 'silhouette',
  perserve: 'preserve',
  preseve: 'preserve',
  analize: 'analyze',
  anlyze: 'analyze',
  comparision: 'comparison',
  comparsion: 'comparison',
  proprotions: 'proportions',
  propotions: 'proportions',
  continuty: 'continuity',
  contiuity: 'continuity',
  timstamp: 'timestamp',
  timestmap: 'timestamp',
  overcote: 'overcoat',
  charcol: 'charcoal',
  definately: 'definitely',
  seperate: 'separate',
  occurence: 'occurrence',
  recieve: 'receive',
  accomodate: 'accommodate',
  mispelled: 'misspelled',
  backround: 'background',
  backgroud: 'background',
  forground: 'foreground',
  movment: 'movement',
  movemnt: 'movement',
  camra: 'camera',
  caemra: 'camera',
  subejct: 'subject',
  subjct: 'subject',
  sceen: 'scene',
  refernce: 'reference',
  refrence: 'reference',
  constriants: 'constraints',
  constrainst: 'constraints',
  artifcats: 'artifacts',
  artefacts: 'artifacts',
  ovrelays: 'overlays',
  overalys: 'overlays',
  textrue: 'texture',
  texutre: 'texture',
  mettalic: 'metallic',
  shaddow: 'shadow',
  shalow: 'shallow',
  focsu: 'focus',
  fucos: 'focus',
  pavementt: 'pavement',
  pavment: 'pavement',
  wristwach: 'wristwatch',
  prototpye: 'prototype',
  produciton: 'production',
  consistancy: 'consistency',
  consitency: 'consistency',
  aligment: 'alignment',
  alignemnt: 'alignment',
  recomendation: 'recommendation',
  structre: 'structure',
  structrue: 'structure',
  critque: 'critique',
  narrtive: 'narrative',
  effeciveness: 'effectiveness',
  effectivness: 'effectiveness',
  visula: 'visual',
  vidio: 'video',
  vidoe: 'video',
  phoot: 'photo',
  phto: 'photo',
  phtoo: 'photo',
  modle: 'model',
  moadl: 'modal',
  analys: 'analysis',
  anaylsis: 'analysis',
  stiching: 'stitching',
  stitiching: 'stitching',
  exculde: 'exclude',
  incldue: 'include',
  inclue: 'include',
  detials: 'details',
  deatails: 'details',
  atmospehre: 'atmosphere',
  atmospher: 'atmosphere',
  pallete: 'palette',
  pallette: 'palette',
  brigtness: 'brightness',
  contast: 'contrast',
  contrst: 'contrast',
  saturaton: 'saturation',
  reolution: 'resolution',
  resoultion: 'resolution',
  duraion: 'duration',
  duraton: 'duration',
  framerate: 'framerate',
  verifable: 'verifiable',
  dimensons: 'dimensions',
  dimesions: 'dimensions',
};

const CORE_VOCABULARY = new Set(
  (
    'a an and are as at be by for from has have he her his in is it its of on or that the their them there they this to was were will with ' +
    'about above across action add added additional aesthetic after against aim all allow almost alone along already also although always among angle another any appear apply approved architecture around as aspect assess asymmetric atmosphere attached audio audit avoid away ' +
    'back backdrop background balance baseline batch beam because become been before behind being below beneath beside between bezel beyond black blue blur bokeh both bottom box bright brightness brushed build built ' +
    'cab calm camera can cannot capture careful carefully case cast center change charcoal check checks checklist choose crisp cinematic clarity clean clear clip closeup close cloth clothing coat collar color compare comparison composed composition concise condition confirm consistency consistent constraints content context continuity contrast control copy core corner correct count cover create crisp critique cut cuts ' +
    'dark darker data date day deep default defect defects define deliverable depth describe description design detail details detect device dial dialogue different dimensions direct directly display distance do does doing dolly dominant down draft dramatic drift duration during dusk ' +
    'each edge editorial effect effectiveness element elements else empty enable end engine ensure enter environment equal error errors establish estimate evaluate evaluation even every exact exactly example exclude excluded excluding expression extra extreme eye ' +
    'fabric face facial fade fail failure falloff fast feature features feedback feel few field fields figure figures file filename fill film filter final find findings finish first fit fix fixes flag flags flare flicker flow focus focusing follow followed following foot footage for force foreground form format framing frame frames free freeze full fully function ' +
    'gap garment gather general generate generation gentle get give given glass glare glide glove gloves go goal golden good grade grading grain grammar green grid group ' +
    'hand hands hard have head header heading heavy height help here high highlight highlights hint hiss hold hook horizontal hour how however hue human ' +
    'idea ideas identify identity if image images impact imperfect import important improve in include included including index indicate individual infer info initial inner input inputs insert inspect inspection instead instruction instructions intensity intended interface into intro item items ' +
    'jump just ' +
    'keep key keys kind ' +
    'label labels lack language large last late later launch layer layout lead leading leather left leg length lens less let level light lighting lights like limb limbs limit line lines list live load local lock long look looking loop lose low lower luxury ' +
    'made main maintain make making manual many mark markers match matching material matte matter max maximum may measure mechanical media medium metallic mid middle might minimal mirror mismatch mismatches mist mix mode model models modern mood more morning most motion mouth move movement moving much multi multimodal multiple must muted ' +
    'name named names narrative natural near necessary need negative neon neutral never new next night no node noise nominal non none normal not note notes notice now number numbers numerals ' +
    'object objects objective of off offer old on once one only open option options or order original other out outcome outer output outputs outside over overall overcoat overlay overlays own ' +
    'pace pacing pack pair palette panel paper part parts pass past pattern pause pavement people per percent perfect perform person perspective photo photos physical physics pick picture piece pipeline pipelines pixel pixels place placement plan plane plate play please plot point points poor pose position positive possible post posture potential pour power precise prefer presence present preserve primary prior priority problem process produce product production profile project prompt prompts proof prop proper proportion proportions prototype provide push ' +
    'quality quantitative quarter quick quickly quiet quite ' +
    'rain rainy range rapid rate rather ratio ratios raw reach read readable ready real realistic really reason receive recent recommend recommendation record red reduce reduced refer reference references refine refinement reflection reflections regular relate related relative release remain remember remove render repeat repetition replace report request required requirement requirements reset resolution resolve response rest result results retention reveal review rhythm rich right rim ring road role roles room rotate rough round row rows rule rules run running ' +
    'safe said same sample samples saturation save saved scale scan scene scenes screen script seam seams search second seconds section sections see seem seems seen select selected selection self send sense sentence separate sequence series serve service session set setting settings several shadow shadows shallow shape share sharp sharpness sheen shift shine shirt short should shoulder show showing shown shutter side sides sight sign signal silent silhouette silver similar simple simply since single sit site sitting size sketch skin sky slate sleek slice slide sliding slight slightly slow slowly small smart smooth smoothly snap soft softly solid solve some someone something sometimes soon sort sound soundscape source space spatial specific specular speech speed spell spelling split spot spotlight spread square stack stage stand standard start state static status steady steel step steps stepping still stitching stock stop store story storyboard straight streak streaks street streetlamp streetlamps strength strict strictly strip strong structure structured study stuff style styles subject subjects subtle subtly success such sudden suddenly suggest suggested suggestion suggestions suit summary sun surface surfaces surround swap switch sync synthetic system ' +
    'table tabular tag tags take taken talk target task tasks teal team technical telemetry tell temperature template templates temporary ten term terms test text texture textures than thank that the them theme then there these they thick thin thing things think third this those though thought thread three threshold through throughout throw thumb tick tight time timeline timer times timestamp timestamps tiny title to today together tone too tool tools top total touch toward towards track tracking trail trailing train transfer transform transition transitions transparent travel treat tree trend trim true try turn turning twilight two type types typical ' +
    'under understand understated uniform uniformity unit units unless unlike until up update updated upload uploaded upon upper urban use used useful user users using usual usually ' +
    'valid value values variable variance variant various vary vast velocity verifiable verify version vertical very video videos view viewer viewers viewport visual visually voice voiceover volume ' +
    'waist wait walk walking wall want warm warmth warning was wash watch watching water wave way we wear weather web week weight well wet what whatever when where whether which while white who whole whom whose why wide width will wind window winter wire with within without woman women wood wool word words work workflow working world worn worse worst would wrap wrist wristwatch write writer writing written wrong ' +
    'year years yellow yes yet you young your zero zone ' +
    Object.values(COMMON_TYPOS).join(' ')
  )
    .toLowerCase()
    .split(/\s+/)
);

function editDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (Math.abs(m - n) > 2) return 3;
  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    new Array(n + 1).fill(0)
  );
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        dp[i][j] = Math.min(dp[i][j], dp[i - 2][j - 2] + 1);
      }
    }
  }
  return dp[m][n];
}

export function checkSpelling(
  text: string,
  ignoredWords: Set<string> = new Set()
): SpellingIssue[] {
  if (!text || text.length < 3) return [];
  const issues: SpellingIssue[] = [];
  const wordRegex = /\b[a-zA-Z]{3,}\b/g;
  let match: RegExpExecArray | null;

  while ((match = wordRegex.exec(text)) !== null) {
    const raw = match[0];
    const lower = raw.toLowerCase();

    // Skip all-caps acronyms (e.g. FPS, JSON, YAML, HDR), ignored words, or known vocabulary
    if (raw === raw.toUpperCase() && raw.length <= 5) continue;
    if (ignoredWords.has(lower)) continue;
    if (CORE_VOCABULARY.has(lower)) continue;

    // Skip likely filenames if followed by a dot+extension
    const after = text.slice(match.index + raw.length, match.index + raw.length + 5);
    if (/^\.[a-z0-9]{2,4}\b/i.test(after)) continue;

    // Direct typo table hit
    if (COMMON_TYPOS[lower]) {
      issues.push({
        word: raw,
        index: match.index,
        length: raw.length,
        suggestions: [matchCase(raw, COMMON_TYPOS[lower])],
      });
      continue;
    }

    // Fuzzy edit-distance search on words >= 4 chars
    if (lower.length >= 4) {
      const candidates: { word: string; dist: number }[] = [];
      for (const vocabWord of CORE_VOCABULARY) {
        if (Math.abs(vocabWord.length - lower.length) > 1) continue;
        if (vocabWord[0] !== lower[0] && vocabWord[vocabWord.length - 1] !== lower[lower.length - 1]) {
          continue;
        }
        const d = editDistance(lower, vocabWord);
        if (d <= 2) {
          candidates.push({ word: vocabWord, dist: d });
        }
      }
      candidates.sort((a, b) => a.dist - b.dist || a.word.localeCompare(b.word));
      if (candidates.length > 0 && candidates[0].dist === 1) {
        issues.push({
          word: raw,
          index: match.index,
          length: raw.length,
          suggestions: candidates.slice(0, 2).map((c) => matchCase(raw, c.word)),
        });
      }
    }

    if (issues.length >= 4) break;
  }

  return issues;
}

function matchCase(source: string, target: string): string {
  if (source[0] && source[0] === source[0].toUpperCase()) {
    return target.charAt(0).toUpperCase() + target.slice(1);
  }
  return target;
}
