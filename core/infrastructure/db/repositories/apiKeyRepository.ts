import { generateApiKey } from "@/lib/auth/apiKeyGenerator";
import { hashApiKey } from "@/lib/auth/hashApiKey";
import { prisma } from "@/lib/prisma";

interface ApiKeyRecord {
    id: string;
    name: string;
    organizationId: string;
    scopes: string[];
    createdAt: Date;
    lastUsedAt: Date | null;
}

export class ApiKeyRepository {

    async createKey(organizationId: string, name: string, permissions: string[], expiresAt?: Date): Promise<string> {
        // steps:
        // 1. generate raw key
        const rawKey = generateApiKey()
        // 2. hash raw key
        const hashedKey = hashApiKey(rawKey)
        // 3. store hashed key with org ID and scopes
        await prisma.apiKey.create({
            data: {
                organizationId,
                name,
                hashedKey,
                scopes: permissions,
                expiresAt: expiresAt ?? null,
            }
        })
        // 4. return raw key
        return rawKey;
    }

    async listKeys(organizationId: string): Promise<ApiKeyRecord[]> {
        // steps:
        // 1. query all keys for org ID where revokedAt is null and (no expiry or not yet expired)
        const apiKeys = await prisma.apiKey.findMany({
            where: {
                organizationId,
                revokedAt: null,
                OR: [
                    { expiresAt: null },
                    { expiresAt: { gt: new Date() } }
                ]
            },
            select: {
                id: true,
                name: true,
                organizationId: true,
                scopes: true,
                createdAt: true,
                lastUsedAt: true,
            }
        });
        // 2. return list of keys (without hashed keys) just name, scopes, createdAt, lastUsedAt
        return apiKeys;
    }

    async findById(id: string): Promise<ApiKeyRecord | null> {
        // steps:
        // 1. query key by id
        const apiKey = await prisma.apiKey.findFirst({
            where: {
                id,
                revokedAt: null,
                expiresAt: { gt: new Date() }
            },
            select: {
                id: true,
                name: true,
                organizationId: true,
                scopes: true,
                createdAt: true,
                lastUsedAt: true,
            }
        });
        // 2. return key record
        if (!apiKey) {
            return null;
        }

        return apiKey;
    }

    async findByHashedKey(hashedKey: string): Promise<ApiKeyRecord | null> {
        const apiKey = await prisma.apiKey.findFirst({
            where: {
                hashedKey,
                revokedAt: null,
                expiresAt: { gt: new Date() }
            },
            select: {
                id: true,
                name: true,
                organizationId: true,
                scopes: true,
                createdAt: true,
                lastUsedAt: true,
            }
        });
        
        if (!apiKey) {
            return null;
        }

        return apiKey;
    }

    async validateKey(rawKey: string): Promise<ApiKeyRecord | null>{
        // steps:
        // 1. hash raw key
        const hashedKey = hashApiKey(rawKey)
        // 2. query key by hashedKey where revokedAt is null and expiresAt > now
        const apiKey = await prisma.apiKey.findFirst({
            where: {
                hashedKey,
                revokedAt: null,
                expiresAt: { gt: new Date() }
            },
            select: {
                id: true,
                name: true,
                organizationId: true,
                scopes: true,
                createdAt: true,
                lastUsedAt: true
            }
        });

        // 3. return key record if valid, else null
        if (!apiKey) {
            return null;
        }

        return apiKey;
    }

    /** Returns key ownership for auth check; does not filter by revoked/expired. */
    async findByIdForAuth(id: string): Promise<{ organizationId: string } | null> {
        const key = await prisma.apiKey.findUnique({
            where: { id },
            select: { organizationId: true }
        });
        return key;
    }

    async revokeKey(id: string) {
        // steps:
        // 1. update key by id set revokedAt = now
        await prisma.apiKey.update({
            where: { id },
            data: { revokedAt: new Date() }
        })

    }

    async rotateKey(id: string): Promise<string> {
        // steps:
        // 1. Fetch old key
        const apikey = await prisma.apiKey.findUnique({
            where: { id },
            select: {
                organizationId: true,
                name: true,
                scopes: true,
            }
        }); 
        // 2. Revoke old key
        if (!apikey) {
            throw new Error("API key not found");
        }
        await this.revokeKey(id);
        // 3. Generate new raw key
        const newRawKey = generateApiKey();
        // 4. Hash new key
        const newHashedKey = hashApiKey(newRawKey);
        // 5. Create new ApiKey with same scopes
        await prisma.apiKey.create({
            data: {
                organizationId: apikey.organizationId,
                name: apikey.name,
                hashedKey: newHashedKey,
                scopes: apikey.scopes,
            }
        })
        // 6. Return new raw key once
        return newRawKey;
    }

    async updateLastUsed(id: string) {
        // steps:
        // 1. update key by id set lastUsedAt = now
        await prisma.apiKey.update({
            where: { id },
            data: { lastUsedAt: new Date() }
        })
    }
}

export const apiKeyRepository = new ApiKeyRepository();