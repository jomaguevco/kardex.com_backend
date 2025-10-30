import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';

export interface AuthRequest extends Request {
  user?: {
    id: number;
    nombre_usuario: string;
    nombre: string;
    rol: string;
  };
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ message: 'Token de acceso requerido' });
    return;
  }

  jwt.verify(token, config.jwt.secret, (err: any, user: any) => {
    if (err) {
      res.status(403).json({ message: 'Token inválido' });
      return;
    }
    req.user = user;
    next();
  });
};

export const requireRole = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ message: 'Autenticación requerida' });
      return;
    }

    if (!roles.includes(req.user.rol)) {
      res.status(403).json({ message: 'Permisos insuficientes' });
      return;
    }

    next();
  };
};

