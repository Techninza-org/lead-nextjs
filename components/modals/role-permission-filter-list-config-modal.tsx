import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { useModal } from "@/hooks/use-modal-store";
import { useMutation } from "graphql-hooks";
import { useAtomValue } from "jotai";
import { userAtom } from "@/lib/atom/userAtom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import FilterBuilder from '../role/data-filter-builder';
import { ScrollArea } from "../ui/scroll-area";
import { userQueries } from "@/lib/graphql/user/queries";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Search, GripVertical } from 'lucide-react';

interface Column {
  name: string;
  visible: boolean;
  readonly?: boolean;
  optOut?: boolean;
  order: number;
}

interface Relationship {
  fromField: string;
  fromFields: string[];
  fromModel: string;
  isList: boolean;
  name: string;
  toFields: string[];
  toModel: string;
}

interface RelationConfig {
  visible: boolean;
  order: number;
}

interface Role {
  id: string;
  name: string;
  resource: string;
  actions: string;
  listView: string[];
  changeView: string[];
  readonlyFields: string[];
  filters: any[];
  relationConfig?: {
    [key: string]: RelationConfig;
  };
}

export const RolePerimssionFilterListConfig = () => {
  const userInfo = useAtomValue(userAtom);
  const { isOpen, onClose, type, data: modalData } = useModal();
  const { role, table, relationships } = modalData;
  const isModalOpen = isOpen && type === "role:permission_config";

  const getCurrentRole = useCallback(() => {
    if (!role || !table) return null;
    return role.find((r: Role) => r.resource === table.name);
  }, [role, table]);

  const [listColumns, setListColumns] = useState<Column[]>([]);
  const [changeColumns, setChangeColumns] = useState<Column[]>([]);
  const [filters, setFilters] = useState([]);
  const [relationshipConfig, setRelationshipConfig] = useState<{
    [key: string]: RelationConfig;
  }>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [draggedRelation, setDraggedRelation] = useState<string | null>(null);
  const [draggedColumn, setDraggedColumn] = useState<string | null>(null);

  useEffect(() => {
    if (table?.fields) {
      const currentRole = getCurrentRole();

      // Helper function to get order based on array position
      const getOrderFromArray = (fieldName: string, array: string[] = []) => {
        const index = array.indexOf(fieldName);
        return index !== -1 ? index : array.length;
      };

      // Sort and map fields for list view
      const listViewFields = table.fields.map((field: any) => ({
        name: field.name,
        visible: field.name === 'id' ? true : (currentRole?.listView?.includes(field.name) ?? false),
        optOut: false,
        order: field.name === 'id' ? 0 : getOrderFromArray(field.name, currentRole?.listView)
      }));

      // Sort fields based on listView order
      const sortedListColumns = [...listViewFields].sort((a, b) => {
        // Always keep id first
        if (a.name === 'id') return -1;
        if (b.name === 'id') return 1;

        // If both fields are in listView, sort by their order
        const aInList = currentRole?.listView?.includes(a.name);
        const bInList = currentRole?.listView?.includes(b.name);

        if (aInList && bInList) {
          return a.order - b.order;
        }

        // If only one field is in listView, it should come first
        if (aInList) return -1;
        if (bInList) return 1;

        // For fields not in listView, maintain their original order
        return a.order - b.order;
      });

      // Update order based on sorted position
      const finalListColumns = sortedListColumns.map((col, index) => ({
        ...col,
        order: index
      }));

      setListColumns(finalListColumns);

      // Similar process for change view
      const changeViewFields = table.fields.map((field: any) => ({
        name: field.name,
        visible: field.name === 'id' ? true : (currentRole?.changeView?.includes(field.name) ?? false),
        readonly: field.name === 'id' ? true : (currentRole?.readonlyFields?.includes(field.name) ?? false),
        order: field.name === 'id' ? 0 : getOrderFromArray(field.name, currentRole?.changeView)
      }));

      // Sort fields based on changeView order
      const sortedChangeColumns = [...changeViewFields].sort((a, b) => {
        if (a.name === 'id') return -1;
        if (b.name === 'id') return 1;

        const aInChange = currentRole?.changeView?.includes(a.name);
        const bInChange = currentRole?.changeView?.includes(b.name);

        if (aInChange && bInChange) {
          return a.order - b.order;
        }

        if (aInChange) return -1;
        if (bInChange) return 1;

        return a.order - b.order;
      });

      // Update order based on sorted position
      const finalChangeColumns = sortedChangeColumns.map((col, index) => ({
        ...col,
        order: index
      }));

      setChangeColumns(finalChangeColumns);

      // Set filters and relationship config as before
      if (currentRole?.filters) {
        setFilters(currentRole.filters);
      }

      if (relationships) {
        const initialRelationConfig = relationships.reduce((acc: { [key: string]: RelationConfig }, rel: Relationship, index: number) => {
          const existingConfig = currentRole?.relationConfig?.[rel.toModel];
          acc[rel.toModel] = {
            visible: existingConfig?.visible ?? true,
            order: existingConfig?.order ?? index
          };
          return acc;
        }, {});
        setRelationshipConfig(initialRelationConfig);
      }
    }
  }, [table, role, getCurrentRole, relationships]);
  const toggleColumn = (index: number, isListView: boolean, field: 'visible' | 'readonly' | 'optOut') => {
    const setter = isListView ? setListColumns : setChangeColumns;
    const columns = isListView ? listColumns : changeColumns;
    const currentColumn = columns[index];

    if (currentColumn.name === 'id' && (field === 'visible' || field === 'readonly')) return;

    setter((prev) => prev.map((col, i) =>
      i === index ? { ...col, [field]: !col[field] } : col
    ));
  };

  const handleColumnDragStart = (e: React.DragEvent, name: string, isListView: boolean) => {
    e.dataTransfer.setData('text/plain', name);
    setDraggedColumn(name);
  };

  const handleColumnDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.add('bg-gray-100');
  };

  const handleColumnDragLeave = (e: React.DragEvent) => {
    e.currentTarget.classList.remove('bg-gray-100');
  };

  const handleColumnDrop = (e: React.DragEvent, targetName: string, isListView: boolean) => {
    e.preventDefault();
    e.currentTarget.classList.remove('bg-gray-100');

    const draggedName = e.dataTransfer.getData('text/plain');
    if (!draggedName || draggedName === targetName) return;

    const setter = isListView ? setListColumns : setChangeColumns;
    const columns = isListView ? listColumns : changeColumns;

    const draggedColumn = columns.find(col => col.name === draggedName);
    const targetColumn = columns.find(col => col.name === targetName);

    if (!draggedColumn || !targetColumn) return;

    setter(prev => {
      const newColumns = [...prev];
      const draggedOrder = draggedColumn.order;
      const targetOrder = targetColumn.order;

      return newColumns.map(col => {
        if (col.name === draggedName) {
          return { ...col, order: targetOrder };
        }
        if (draggedOrder < targetOrder) {
          if (col.order > draggedOrder && col.order <= targetOrder) {
            return { ...col, order: col.order - 1 };
          }
        } else {
          if (col.order >= targetOrder && col.order < draggedOrder) {
            return { ...col, order: col.order + 1 };
          }
        }
        return col;
      });
    });

    setDraggedColumn(null);
  };

  const toggleRelationVisibility = (toModel: string) => {
    setRelationshipConfig(prev => {
      const currentConfig = prev[toModel] || { visible: true, order: 0 };
      return {
        ...prev,
        [toModel]: {
          ...currentConfig,
          visible: !currentConfig.visible
        }
      };
    });
  };

  const handleDragStart = (e: React.DragEvent, toModel: string) => {
    e.dataTransfer.setData('text/plain', toModel);
    setDraggedRelation(toModel);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.add('bg-gray-100');
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.currentTarget.classList.remove('bg-gray-100');
  };

  const handleDrop = (e: React.DragEvent, targetToModel: string) => {
    e.preventDefault();
    e.currentTarget.classList.remove('bg-gray-100');

    const draggedToModel = e.dataTransfer.getData('text/plain');
    if (!draggedToModel || draggedToModel === targetToModel) return;

    setRelationshipConfig(prev => {
      const newConfig = { ...prev };
      const draggedOrder = newConfig[draggedToModel]?.order ?? 0;
      const targetOrder = newConfig[targetToModel]?.order ?? 0;

      Object.keys(newConfig).forEach(key => {
        const currentConfig = newConfig[key];
        if (draggedOrder < targetOrder) {
          if (currentConfig.order > draggedOrder && currentConfig.order <= targetOrder) {
            newConfig[key] = {
              ...currentConfig,
              order: currentConfig.order - 1
            };
          }
        } else {
          if (currentConfig.order >= targetOrder && currentConfig.order < draggedOrder) {
            newConfig[key] = {
              ...currentConfig,
              order: currentConfig.order + 1
            };
          }
        }
      });

      newConfig[draggedToModel] = {
        ...newConfig[draggedToModel],
        order: targetOrder
      };

      return newConfig;
    });

    setDraggedRelation(null);
  };

  const [updatePermissionFilter] = useMutation(userQueries.UPDATE_PERMISSION_FILTER);
  const { toast } = useToast();

  const handleClose = () => {
    onClose();
  };

  const onSubmit = async () => {
    const currentRole = getCurrentRole();
    if (!currentRole) {
      toast({
        variant: "destructive",
        title: "Error",
      });
      return;
    }

    const sortedListColumns = [...listColumns].sort((a, b) => a.order - b.order);
    const sortedChangeColumns = [...changeColumns].sort((a, b) => a.order - b.order);

    const updatedListView = sortedListColumns
      .filter(col => col.visible)
      .map(col => col.name);

    const updatedChangeView = sortedChangeColumns
      .filter(col => col.visible)
      .map(col => col.name);

    const updatedReadonlyFields = sortedChangeColumns
      .filter(col => col.readonly)
      .map(col => col.name);

    const optOutFields = sortedListColumns
      .filter(col => col.optOut)
      .map(col => col.name);

    if (!updatedListView.includes('id')) updatedListView.push('id');
    if (!updatedChangeView.includes('id')) updatedChangeView.push('id');
    if (!updatedReadonlyFields.includes('id')) updatedReadonlyFields.push('id');

    const { data, error } = await updatePermissionFilter({
      variables: {
        resourceName: table?.name,
        data: {
          id: currentRole.id,
          listView: updatedListView,
          changeView: updatedChangeView,
          readonlyFields: updatedReadonlyFields,
          optOutFields,
          filters,
          relationConfig: relationshipConfig
        }
      }
    });

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
      });
      return;
    }

    toast({
      variant: "default",
      title: "Config updated successfully",
    });
  };

  const handleFilterChange = (newFilters: any) => {
    setFilters(newFilters);
  };

  const filteredRelationships = relationships ? relationships
    .filter((rel: Relationship) =>
      rel.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a: Relationship, b: Relationship) => {
      const orderA = relationshipConfig[a.toModel]?.order ?? 0;
      const orderB = relationshipConfig[b.toModel]?.order ?? 0;
      return orderA - orderB;
    }) : [];

  return (
    <Dialog open={isModalOpen} onOpenChange={handleClose}>
      <DialogContent className="text-black max-w-screen-lg">
        <DialogHeader className="pt-8 px-6">
          <DialogTitle className="text-2xl text-center font-bold">
            Role Config for {table?.name}
          </DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="Filter" className="w-full">
          <TabsList className="w-full flex justify-between">
            <div className="flex">
              <TabsTrigger value="Filter">Filter</TabsTrigger>
              <TabsTrigger value="list">List View</TabsTrigger>
              <TabsTrigger value="change">Change View</TabsTrigger>
              <TabsTrigger value="relations">Relations</TabsTrigger>
            </div>
            <Button onClick={onSubmit}>Submit</Button>
          </TabsList>
          <TabsContent value="Filter">
            <FilterBuilder
              fields={table?.fields || []}
              onFilterChange={handleFilterChange}
              filters={filters}
            />
          </TabsContent>

          <TabsContent value="list">
            <TableWithSearch
              columns={listColumns}
              type="list"
              toggleColumn={toggleColumn}
              onDragStart={handleColumnDragStart}
              onDragOver={handleColumnDragOver}
              onDragLeave={handleColumnDragLeave}
              onDrop={handleColumnDrop}
            />
          </TabsContent>

          <TabsContent value="change">
            <TableWithSearch
              columns={changeColumns}
              type="change"
              toggleColumn={toggleColumn}
              onDragStart={handleColumnDragStart}
              onDragOver={handleColumnDragOver}
              onDragLeave={handleColumnDragLeave}
              onDrop={handleColumnDrop}
            />
          </TabsContent>

          <TabsContent value="relations">
            <div className="space-y-4">
              <div className="flex items-center space-x-2 pb-4">
                <Search className="w-4 h-4 text-gray-500" />
                <Input
                  placeholder="Search relations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1"
                />
              </div>
              <ScrollArea className="h-[440px] w-full rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-8"></TableHead>
                      <TableHead>Relation Name</TableHead>
                      <TableHead>Model</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Visible</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRelationships.map((relation: Relationship, index: number) => (
                      <TableRow
                        key={index}
                        draggable
                        onDragStart={(e) => handleDragStart(e, relation.toModel)}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, relation.toModel)}
                        className="cursor-move hover:bg-gray-50 transition-colors"
                      >
                        <TableCell>
                          <GripVertical className="w-4 h-4 text-gray-500" />
                        </TableCell>
                        <TableCell>{relation.name}</TableCell>
                        <TableCell>{relation.toModel}</TableCell>
                        <TableCell>{relation.isList ? 'Many' : 'One'}</TableCell>
                        <TableCell>
                          <Checkbox
                            checked={relationshipConfig[relation.toModel]?.visible ?? true}
                            onCheckedChange={() => toggleRelationVisibility(relation.toModel)}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

interface TableWithSearchProps {
  columns: Column[];
  type: 'list' | 'change';
  toggleColumn: (index: number, isList: boolean, field: 'visible' | 'readonly' | 'optOut') => void;
  onDragStart: (e: React.DragEvent, name: string, isListView: boolean) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, targetName: string, isListView: boolean) => void;
}

const TableWithSearch = ({
  columns,
  type,
  toggleColumn,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop
}: TableWithSearchProps) => {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredColumns = useMemo(() => {
    return [...columns]
      .sort((a, b) => a.order - b.order)
      .filter(column =>
        column.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
  }, [columns, searchTerm]);

  return (
    <div className="space-y-4">
      <div className='flex justify-between'>
        <div className="flex items-center space-x-2 px-4">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search fields..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-8 w-[150px] lg:w-[250px]"
          />
        </div>
        <Button variant={'secondary'}>Total Rows: {filteredColumns.length}</Button>
      </div>
      <ScrollArea className="h-[430px] w-full rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8"></TableHead>
              <TableHead>Field Name</TableHead>
              <TableHead>Visible</TableHead>
              {type === 'list' && <TableHead>Opt Out</TableHead>}
              {type === 'change' && <TableHead>Read Only</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredColumns.map((column) => {
              const originalIndex = columns.findIndex(c => c.name === column.name);
              return (
                <TableRow
                  key={column.name}
                  draggable
                  onDragStart={(e) => onDragStart(e, column.name, type === 'list')}
                  onDragOver={onDragOver}
                  onDragLeave={onDragLeave}
                  onDrop={(e) => onDrop(e, column.name, type === 'list')}
                  className="cursor-move hover:bg-gray-50 transition-colors"
                >
                  <TableCell>
                    <GripVertical className="w-4 h-4 text-gray-500" />
                  </TableCell>
                  <TableCell>{column.name}</TableCell>
                  <TableCell>
                    <Checkbox
                      checked={column.visible}
                      disabled={column.name === 'id'}
                      onCheckedChange={() => toggleColumn(originalIndex, type === 'list', 'visible')}
                    />
                  </TableCell>
                  {type === 'list' && (
                    <TableCell>
                      <Checkbox
                        checked={column.optOut}
                        onCheckedChange={() => toggleColumn(originalIndex, true, 'optOut')}
                      />
                    </TableCell>
                  )}
                  {type === 'change' && (
                    <TableCell>
                      <Checkbox
                        checked={column.readonly}
                        disabled={column.name === 'id' || !column.visible}
                        onCheckedChange={() => toggleColumn(originalIndex, false, 'readonly')}
                      />
                    </TableCell>
                  )}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </ScrollArea>
    </div>
  );
};