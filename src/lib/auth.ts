import { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import { prisma } from './prisma'

export async function auth() {
  try {
    // Pegar token do cookie
    const cookieStore = cookies()
    const token = cookieStore.get('auth-token')?.value
    
    if (!token) {
      return null
    }

    // Verificar e decodificar JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: string
      email: string
      plan: string
    }

    // Buscar usuário completo no banco
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        plan: true,
        status: true,
        expirationDate: true,
        customPermissions: true,
        avatar: true,
        mustChangePassword: true,
        entitlements: {
          select: {
            id: true,
            code: true,
            status: true,
            expiresAt: true,
            origin: true,
            createdAt: true,
            updatedAt: true
          }
        }
      }
    })

    if (!user || user.status !== 'ACTIVE') {
      return null
    }

    // Verificar se acesso expirou
    if (user.expirationDate && user.expirationDate < new Date()) {
      return null
    }

    // Determinar permissões baseado no seu sistema
    const isAdmin = user.plan === 'ADMIN'
    const isAnalyst = user.plan === 'ANALISTA'
    
    // Verificar se tem acesso à análise de carteira
    let customPermissions: string[] = []

    if (user.customPermissions) {
      try {
        customPermissions = JSON.parse(user.customPermissions || '[]')
      } catch (error) {
        console.error('Erro ao interpretar permissões personalizadas:', error)
        customPermissions = []
      }
    }

    const activeEntitlements = (user.entitlements ?? []).filter(entitlement => {
      if (entitlement.status !== 'ACTIVE') {
        return false
      }

      if (entitlement.expiresAt && entitlement.expiresAt < new Date()) {
        return false
      }

      return true
    }).map(entitlement => entitlement.code)

    const hasVipAccess = user.plan === 'VIP' ||
                        user.plan === 'ADMIN' ||
                        customPermissions.includes('recursos-exclusivos')

    const role = isAdmin ? 'ADMIN' : isAnalyst ? 'ANALISTA' : 'USER'

    return {
      user: {
        id: user.id,
        role,
        name: `${user.firstName} ${user.lastName}`.trim(),
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        plan: user.plan,
        avatar: user.avatar,
        customPermissions,
        entitlements: user.entitlements?.map(entitlement => ({
          ...entitlement,
          expiresAt: entitlement.expiresAt?.toISOString?.() ?? null,
          createdAt: entitlement.createdAt?.toISOString?.(),
          updatedAt: entitlement.updatedAt?.toISOString?.()
        })),
        activeEntitlements,
        canUploadPortfolio: hasVipAccess,
        hasVipAccess,
        mustChangePassword: user.mustChangePassword
      }
    }
  } catch (error) {
    console.error('Erro na autenticação:', error)
    return null
  }
}