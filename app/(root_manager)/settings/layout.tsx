import { MenuBar } from "@/components/ui/menu-bar";

export default function SettingLayout({ children }: { children: React.ReactNode }) {
   return (
      <div>
         <MenuBar />
         {children}
      </div>

   )
}