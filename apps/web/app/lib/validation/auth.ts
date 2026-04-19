import { z } from "zod";

// Schema de registro - Paso 1 (Información básica)
export const registerStep1Schema = z.object({
  firstName: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  lastName: z.string().min(2, "Los apellidos deben tener al menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  companyName: z.string().optional().or(z.literal("")),
  role: z.string().min(1, "Selecciona un cargo/rol"),
});

export type RegisterStep1Input = z.infer<typeof registerStep1Schema>;

// Schema de registro - Paso 2 (Contraseña)
export const registerStep2Schema = z.object({
  password: z
    .string()
    .min(8, "La contraseña debe tener al menos 8 caracteres")
    .regex(/[A-Za-z]/, "La contraseña debe contener al menos una letra")
    .regex(/[0-9]/, "La contraseña debe contener al menos un número"),
  confirmPassword: z.string().min(1, "Confirma tu contraseña"),
})
.refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

export type RegisterStep2Input = z.infer<typeof registerStep2Schema>;

// Schema completo de registro (para compatibilidad con backend)
export const registerSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  password: z
    .string()
    .min(8, "La contraseña debe tener al menos 8 caracteres")
    .regex(/[A-Za-z]/, "La contraseña debe contener al menos una letra")
    .regex(/[0-9]/, "La contraseña debe contener al menos un número"),
  confirmPassword: z.string().min(1, "Confirma tu contraseña"),
  companyName: z.string().optional().or(z.literal("")),
})
.refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

export type RegisterInput = z.infer<typeof registerSchema>;

// Schema de login
export const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "La contraseña es requerida"),
});

export type LoginInput = z.infer<typeof loginSchema>;

// Schema de reset request
export const resetRequestSchema = z.object({
  email: z.string().email("Email inválido"),
});

export type ResetRequestInput = z.infer<typeof resetRequestSchema>;

// Schema de reset confirm
export const resetConfirmSchema = z.object({
  token: z.string().min(1, "Token requerido"),
  password: z
    .string()
    .min(8, "La contraseña debe tener al menos 8 caracteres")
    .regex(/[A-Za-z]/, "La contraseña debe contener al menos una letra")
    .regex(/[0-9]/, "La contraseña debe contener al menos un número"),
  confirmPassword: z.string().min(1, "Confirma tu contraseña"),
})
.refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

export type ResetConfirmInput = z.infer<typeof resetConfirmSchema>;
