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
    manufacturingDate?: Date | string | null;
    expiryDate?: Date | string | null;
    createdAt: Date;
    updatedAt: Date;
}