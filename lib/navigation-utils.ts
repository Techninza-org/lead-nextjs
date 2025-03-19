interface Item {
   _id: { $oid: string };
   name: string;
   order: { $numberLong: string };
   companyDeptId: { $oid: string };
   dependentOnId: string;
   categoryId: { $oid: string };
   category?: { name: string }; // Added category object
   createdAt: { $date: string };
   updatedAt: { $date: string };
}

interface TreeNode {
   name: string;
   children: TreeNode[];
   category?: string; // Added category name
}

export function newbuildHierarchy(items: Item[]): TreeNode[] {
   const nodeMap: { [key: string]: TreeNode } = {};
   const roots: TreeNode[] = [];

   // Step 1: Create nodes for all items
   items.forEach(item => {
      if (!nodeMap[item.name]) {
         nodeMap[item.name] = { 
            name: item.name, 
            children: [],
            category: item.category?.name // Add category name from item
         };
      }
   });

   // Step 2: Link children to parents
   items.forEach(item => {
      const node = nodeMap[item.name];
      const parentName = item.dependentOnId;

      if (parentName === "") {
         roots.push(node); // No parent, so it's a root
      } else if (nodeMap[parentName]) {
         nodeMap[parentName].children.push(node); // Attach to parent
      } else {
         roots.push(node); // Parent not found, treat as root
      }
   });

   return roots;
}