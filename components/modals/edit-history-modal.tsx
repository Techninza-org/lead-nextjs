import React, { useState, useEffect } from 'react';
import {
   Dialog,
   DialogContent,
   DialogHeader,
   DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useModal } from "@/hooks/use-modal-store";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
   Table,
   TableBody,
   TableCell,
   TableHead,
   TableHeader,
   TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { History, User, Clock, Edit3 } from "lucide-react";
import { useQuery } from 'graphql-hooks';
import { historyQueries } from '@/lib/graphql/history/queries';
import { useToast } from '../ui/use-toast';

interface EditHistoryRecord {
   id: string;
   documentId: string;
   tableName: string;
   formName: string;
   fieldName: string;
   previousValue: string | null;
   newValue: string | null;
   editedBy: string;
   editedByName: string | null;
   editType: string;
   timestamp: string;
   orgId: string;
}

export const EditHistoryModal = () => {
   const { isOpen, onClose, type, data: modalData } = useModal();
   const { toast } = useToast();
   const [historyData, setHistoryData] = useState<EditHistoryRecord[]>([]);

   const isModalOpen = isOpen && type === "editHistory";

   const { data, loading, error } = useQuery(historyQueries.GET_EDIT_HISTORY, {
      variables: {
         documentId: modalData?.documentId,
         tableName: modalData?.tableName,
         formName: modalData?.formName,
      },
      skip: !isModalOpen || !modalData?.documentId,
   });

   useEffect(() => {
      console.log('EditHistory Modal - Data received:', data);
      console.log('EditHistory Modal - Error:', error);
      console.log('EditHistory Modal - Loading:', loading);
      console.log('EditHistory Modal - Modal Data:', modalData);
      
      if (data?.getEditHistory) {
         // Handle the response structure from the backend
         if (Array.isArray(data.getEditHistory)) {
            // Direct array response
            setHistoryData(data.getEditHistory);
         } else {
            // Handle any other response structure
            console.log('Unexpected response structure:', data.getEditHistory);
            setHistoryData([]);
         }
      }
      if (error) {
         console.error('GraphQL Error:', error);
         toast({
            title: "GraphQL Error",
            description: `GraphQL error: ${error.message}`,
            variant: "destructive",
         });
      }
   }, [data, error, loading, modalData, toast]);

   const handleClose = () => {
      onClose();
      setHistoryData([]);
   };

   const formatTimestamp = (timestamp: string) => {
      const date = new Date(timestamp);
      return date.toLocaleString();
   };

   const getEditTypeColor = (editType: string) => {
      switch (editType) {
         case 'CREATE':
            return 'bg-green-100 text-green-800';
         case 'UPDATE':
            return 'bg-blue-100 text-blue-800';
         case 'DELETE':
            return 'bg-red-100 text-red-800';
         default:
            return 'bg-gray-100 text-gray-800';
      }
   };

   if (!modalData) return null;

   return (
      <Dialog open={isModalOpen} onOpenChange={handleClose}>
         <DialogContent className="text-black max-w-[80vw] max-h-[80vh]">
            <DialogHeader className="pt-6">
               <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                  <History className="h-6 w-6" />
                  Edit History
                  <Badge variant="outline" className="text-xs text-gray-600 font-medium">
                     {modalData.formName}
                  </Badge>
               </DialogTitle>
               <Separator className="my-4" />
            </DialogHeader>
            
            <ScrollArea className="max-h-[60vh] w-full rounded-md border">
               <div className="p-4">
                  {loading ? (
                     <div className="flex items-center justify-center py-8">
                        <div className="text-gray-500">Loading edit history...</div>
                     </div>
                  ) : error ? (
                     <div className="flex items-center justify-center py-8">
                        <div className="text-red-500">Error loading edit history</div>
                     </div>
                  ) : historyData.length === 0 ? (
                     <div className="flex items-center justify-center py-8">
                        <div className="text-gray-500">No edit history found</div>
                     </div>
                  ) : (
                     <Card className="overflow-hidden">
                        <CardContent className="p-0">
                           <Table>
                              <TableHeader>
                                 <TableRow>
                                    <TableHead className="font-bold">Field</TableHead>
                                    <TableHead className="font-bold">Previous Value</TableHead>
                                    <TableHead className="font-bold">New Value</TableHead>
                                    <TableHead className="font-bold">Edited By</TableHead>
                                    <TableHead className="font-bold">Type</TableHead>
                                    <TableHead className="font-bold">Timestamp</TableHead>
                                 </TableRow>
                              </TableHeader>
                              <TableBody>
                                 {historyData.map((record) => (
                                    <TableRow key={record.id}>
                                       <TableCell className="font-medium">
                                          <div className="flex items-center gap-2">
                                             <Edit3 className="h-4 w-4 text-gray-500" />
                                             {record.fieldName}
                                          </div>
                                       </TableCell>
                                       <TableCell>
                                          <div className="max-w-[200px] truncate">
                                             {record.previousValue || (
                                                <span className="text-gray-400 italic">No previous value</span>
                                             )}
                                          </div>
                                       </TableCell>
                                       <TableCell>
                                          <div className="max-w-[200px] truncate">
                                             {record.newValue || (
                                                <span className="text-gray-400 italic">No new value</span>
                                             )}
                                          </div>
                                       </TableCell>
                                       <TableCell>
                                          <div className="flex items-center gap-2">
                                             <User className="h-4 w-4 text-gray-500" />
                                             <span>{record.editedByName || record.editedBy}</span>
                                          </div>
                                       </TableCell>
                                       <TableCell>
                                          <Badge className={getEditTypeColor(record.editType)}>
                                             {record.editType}
                                          </Badge>
                                       </TableCell>
                                       <TableCell>
                                          <div className="flex items-center gap-2">
                                             <Clock className="h-4 w-4 text-gray-500" />
                                             <span className="text-sm">
                                                {formatTimestamp(record.timestamp)}
                                             </span>
                                          </div>
                                       </TableCell>
                                    </TableRow>
                                 ))}
                              </TableBody>
                           </Table>
                        </CardContent>
                     </Card>
                  )}
               </div>
            </ScrollArea>
            
            <div className="flex justify-end pt-4">
               <Button onClick={handleClose} variant="outline">
                  Close
               </Button>
            </div>
         </DialogContent>
      </Dialog>
   );
};
