import type { Equipment } from '../types';
import { getLibraryDataByType } from '../utils/custom-library';
import { loadCustomEquipments, mergeData } from '../utils/loader';

interface EquipmentData {
  [key: string]: Equipment[];
}

/**
 * 初始装备数据
 */
const Equipments: EquipmentData = {};

// 加载并合并自定义装备数据
let mergedEquipmentsData: EquipmentData | null = null;

/**
 * 初始化装备数据（加载自定义数据并合并）
 */
async function initializeEquipments() {
  const customData = await loadCustomEquipments();
  const merged = mergeData(Equipments, customData) as EquipmentData;

  mergedEquipmentsData = merged;
}

/**
 * 获取合并后的装备数据
 */
export function getEquipments(): EquipmentData {
  return mergeData(
    mergedEquipmentsData || Equipments,
    getLibraryDataByType<Equipment>('equipment'),
  ) as EquipmentData;
}

// 自动初始化
initializeEquipments();
