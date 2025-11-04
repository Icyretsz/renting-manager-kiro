import prisma from '../config/database';
import { DatabaseError, NotFoundError } from '../utils/errors';

export interface CreateSettingData {
  key: string;
  value: number;
  description?: string;
  updatedBy?: string;
}

export interface UpdateSettingData {
  value: number;
  updatedBy?: string;
}

/**
 * Get all settings
 */
export const getAllSettings = async () => {
  try {
    return await prisma.setting.findMany({
      orderBy: { key: 'asc' }
    });
  } catch (error) {
    throw new DatabaseError('Failed to get settings');
  }
};

/**
 * Get setting by key
 */
export const getSettingByKey = async (key: string) => {
  try {
    return await prisma.setting.findUnique({
      where: { key }
    });
  } catch (error) {
    throw new DatabaseError('Failed to get setting');
  }
};

/**
 * Get setting value by key (returns number or default)
 */
export const getSettingValue = async (key: string, defaultValue: number = 0): Promise<number> => {
  try {
    const setting = await prisma.setting.findUnique({
      where: { key }
    });
    return setting ? Number(setting.value) : defaultValue;
  } catch (error) {
    return defaultValue;
  }
};

/**
 * Create or update setting
 */
export const upsertSetting = async (key: string, data: UpdateSettingData) => {
  try {
    const updateData: any = {
      value: data.value,
    };
    if (data.updatedBy !== undefined) {
      updateData.updatedBy = data.updatedBy;
    }

    const createData: any = {
      key,
      value: data.value,
    };
    if (data.updatedBy !== undefined) {
      createData.updatedBy = data.updatedBy;
    }

    return await prisma.setting.upsert({
      where: { key },
      update: updateData,
      create: createData
    });
  } catch (error) {
    throw new DatabaseError('Failed to upsert setting');
  }
};

/**
 * Update setting by key
 */
export const updateSetting = async (key: string, data: UpdateSettingData) => {
  try {
    const setting = await prisma.setting.findUnique({
      where: { key }
    });

    if (!setting) {
      throw new NotFoundError('Setting not found');
    }

    const updateData: any = {
      value: data.value,
    };
    if (data.updatedBy !== undefined) {
      updateData.updatedBy = data.updatedBy;
    }

    return await prisma.setting.update({
      where: { key },
      data: updateData
    });
  } catch (error) {
    if (error instanceof NotFoundError) {
      throw error;
    }
    throw new DatabaseError('Failed to update setting');
  }
};

/**
 * Create new setting
 */
export const createSetting = async (data: CreateSettingData) => {
  try {
    const createData: any = {
      key: data.key,
      value: data.value,
    };
    if (data.description !== undefined) {
      createData.description = data.description;
    }
    if (data.updatedBy !== undefined) {
      createData.updatedBy = data.updatedBy;
    }

    return await prisma.setting.create({
      data: createData
    });
  } catch (error) {
    throw new DatabaseError('Failed to create setting');
  }
};

/**
 * Delete setting by key
 */
export const deleteSetting = async (key: string) => {
  try {
    const setting = await prisma.setting.findUnique({
      where: { key }
    });

    if (!setting) {
      throw new NotFoundError('Setting not found');
    }

    return await prisma.setting.delete({
      where: { key }
    });
  } catch (error) {
    if (error instanceof NotFoundError) {
      throw error;
    }
    throw new DatabaseError('Failed to delete setting');
  }
};

/**
 * Initialize default settings
 */
export const initializeDefaultSettings = async () => {
  const defaultSettings = [
    {
      key: 'trash_fee',
      value: 52000,
      description: 'Monthly trash collection fee per room (VND)'
    },
    {
      key: 'electricity_rate',
      value: 3500,
      description: 'Electricity rate per kWh (VND)'
    },
    {
      key: 'water_rate',
      value: 22000,
      description: 'Water rate per cubic meter (VND)'
    }
  ];

  try {
    for (const setting of defaultSettings) {
      await prisma.setting.upsert({
        where: { key: setting.key },
        update: {}, // Don't update if exists
        create: setting
      });
    }
  } catch (error) {
    throw new DatabaseError('Failed to initialize default settings');
  }
};