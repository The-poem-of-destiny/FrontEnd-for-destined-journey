export interface CharacterData {
  姓名?: string;
  等级?: string | number;
  种族?: string;
  生命层级?: string;
  身份?: string | string[];
  职业?: string | string[];
  性格?: string | string[];
  喜爱?: string | string[];
  外貌特质?: string;
  衣物装饰?: string;
  背景故事?: string;

  属性?: Partial<Record<'力量' | '敏捷' | '体质' | '智力' | '精神', string | number>>;
  资源?: { HP?: number; MP?: number; SP?: number };

  技能?: Array<Record<string, any>>;
  装备?: Array<Record<string, any>>;
  道具?: Array<Record<string, any>>;
  特殊物品?: Array<Record<string, any>>;
  物品?: Array<Record<string, any>>;

  登神长阶?: Record<string, any>;
  神位?: string;
  神国?: Record<string, any>;
  要素?: Array<Record<string, any>>;
  权能?: Array<Record<string, any>>;
  法则?: Array<Record<string, any>>;

  [key: string]: any;
}

export interface ParseSuccess {
  success: true;
  data: CharacterData;
}

export interface FriendlyYamlError {
  message: string;
  line?: number;
  column?: number;
  cleanedLine?: string;
  originalLine?: string;
  caretLine?: string;
}

export interface ParseFailure {
  success: false;
  error: FriendlyYamlError;
}

export type ParseResult = ParseSuccess | ParseFailure;

export interface ThemeResolved {
  tier: number;
  raceKey: string;
  raceHex: string;
  tierHex: string;
  raceRgb: string;
  tierRgb: string;
}
