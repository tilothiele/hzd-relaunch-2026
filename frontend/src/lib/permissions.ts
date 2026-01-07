import { AuthUser } from "@/types";

export default {
    isBreeder: (user: AuthUser | null) => {
        return user?.role?.name === 'breeder'
    }
}