import type { Role } from "@/lib/generated/prisma/enums";

/** Minimal, serializable user shape passed from the server Navbar to its client menus. */
export interface NavUser {
  name: string;
  email: string;
  role: Role;
}

export interface NavLink {
  href: string;
  label: string;
}
