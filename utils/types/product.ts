export interface ProductSchema {
    id: string;
    name: string;
    description: string;
    category: string;
    dosageForm?: string;
    strength?: string;
    activeIngredients: string[];
    nafdacNumber?: string;
    shelfLifeMonths?: number;
    storageConditions?: string;
    numberOfProductAvailable: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}