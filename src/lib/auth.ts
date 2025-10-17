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
        mustChangePassword: true
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

    const hasVipAccess = user.plan === 'VIP' ||
                        user.plan === 'ADMIN' ||
                        customPermissions.includes('recursos-exclusivos')

    return {
      user: {
        id: user.id,
        role: isAdmin ? 'ADMIN' : 'USER',
        name: `${user.firstName} ${user.lastName}`.trim(),
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        plan: user.plan,
        avatar: user.avatar,
        customPermissions,
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