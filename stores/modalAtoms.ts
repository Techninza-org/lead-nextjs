import { z } from "zod";
import { atom } from "jotai";
import { createLeadSchema, leadSchema } from "@/types/lead";
import { CompanyDeptFieldSchema } from "@/types/company";

export type ModalType = "paymentGateway" | "addLead" | "functionParameters" | "DynamicFunctionParametersModal" | "assignLead" | "submitLead" | "bidForm" | "createBroadcast" | "finacerBidApproval" | 'viewLeadInfo' | "addMember" | "enquiryDetails" | "updateDepartmentFields" | "broadcastDetails" | "updateGlobalDepartmentFields" | "updateGlobalBroadcastForm" | "uploadPrspectModal" | "addProspect" | "uploadLeadModal" | "uploadFormModal" | "addDept" | 'editLeadFormValue' | "viewProspectInfo" | "assignForm" | "role:permission_config" | "create:role" | "childDetails:table" | "bulk:operation" | "editDeptForm" | "admin:company:settings";
export interface ModalData {
    customerId?: string;

    lead?: z.infer<typeof leadSchema>,
    leads?: z.infer<typeof createLeadSchema>[],
    fields?: any
    form?: any
    deptName?: string;
    deptId?: string;
    depId?: string;
    dept?: any;
    broadcastId?: string;
    broadcastForm?: any;
    table?: any;
    role?: any;
    data?: any;
    relationships?: any;
    formName?: string;
    existingTags?: string[];
    id?: string;
    selectedFnName?: string;
    selectedFormNameIds?: string[];
    selectedData?: any;
    formNameIds?: string[];
    unselectedFormNameIds?: string[];

    apiUrl?: string;
    query?: string;
}

export const modalTypeAtom = atom<ModalType | null>(null);
export const modalDataAtom = atom<ModalData>({});
export const modalIsOpenAtom = atom<boolean>(false);
