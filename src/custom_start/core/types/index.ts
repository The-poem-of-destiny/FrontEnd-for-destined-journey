// 稀有度类型
export type Rarity = 'only' | 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic';

// 物品类型
export interface Item {
  name: string;
  cost: number;
  type: string;
  tag?: string[];
  rarity: Rarity;
  quantity?: number;
  effect: Record<string, string>;
  description: string;
  isCustom?: boolean; // 标识是否为自定义数据
}

// 装备类型
export type Equipment = Omit<Item, 'quantity'> & {
  position?: string;
};

// 技能类型
export type Skill = Omit<Item, 'quantity'> & {
  consume?: string;
  isCustom?: boolean; // 标识是否为自定义数据
};

// 伙伴类型
export interface Partner {
  name: string;
  cost: number;
  lifeLevel: string;
  level: number;
  race: string;
  identity: string[];
  career: string[];
  personality: string;
  like: string;
  app: string;
  cloth: string;
  equip: Partial<Omit<Equipment, 'cost'>>[];
  attributes: {
    strength: number;
    dexterity: number;
    constitution: number;
    intelligence: number;
    mind: number;
  };
  stairway: {
    isOpen: boolean;
    elements?: Record<string, Record<string, string>>; // 嵌套键值对：{ "要素名": { "效果名": "效果描述" } }
    powers?: Record<string, Record<string, string>>; // 嵌套键值对：{ "权能名": { "效果名": "效果描述" } }
    laws?: Record<string, Record<string, string>>; // 嵌套键值对：{ "法则名": { "效果名": "效果描述" } }
    godlyRank?: string;
    godKingdom?: {
      name: string;
      description: string;
    };
  };
  isContract: boolean;
  affinity: number;
  comment?: string;
  backgroundInfo?: string;
  skills: Omit<Skill, 'cost'>[];
  isCustom?: boolean; // 标识是否为自定义数据
}

// 背景类型
export interface Background {
  name: string;
  description: string;
  requiredRace?: string;
  requiredLocation?: string;
  requiredIdentity?: string;
  [key: string]: any;
}

// 基础信息数据类型
export interface BaseInfoData {
  genders?: string[];
  raceCosts?: Record<string, number>;
  identityCosts?: Record<string, number>;
  startLocations?: string[];
}

// 属性类型
export interface Attributes {
  力量: number;
  敏捷: number;
  体质: number;
  智力: number;
  精神: number;
}

// 角色配置类型
export interface CharacterConfig {
  name: string;
  gender: string;
  customGender: string;
  age: number;
  race: string;
  customRace: string;
  identity: string;
  customIdentity: string;
  startLocation: string;
  customStartLocation: string;
  level: number;
  /** 基础点分配（总和上限25，单项上限6） */
  basePoints: Record<keyof Attributes, number>;
  /** 额外点分配（总和 = Lv-1） */
  attributePoints: Record<keyof Attributes, number>;
  reincarnationPoints: number; // 转生点数
  destinyPoints: number; // 命运点数
  money: number; // 金钱
}
