import { useState } from "react";
import CategoryManager from "./CategoryManager";
import { categoryNames, gigs } from "./mockData";
import { buildCategories } from "./derive";

const AdminDashboard = () => {
  const [catNames, setCatNames] = useState(categoryNames);

  const handleAdd = (name: string) => {
    setCatNames((prev) => [...prev, { id: `CAT-${Date.now()}`, name }]);
  };

  const handleDelete = (id: string) => {
    setCatNames((prev) => prev.filter((c) => c.id !== id));
  };

  const handleEdit = (id: string) => {
    const newName = prompt("Rename category:");
    if (!newName) return;
    setCatNames((prev) =>
      prev.map((c) => (c.id === id ? { ...c, name: newName } : c))
    );
  };

  const categories = buildCategories(catNames, gigs);

  return (
    <CategoryManager
      categories={categories}
      onAdd={handleAdd}
      onDelete={handleDelete}
      onEdit={handleEdit}
    />
  );
};

export default AdminDashboard;