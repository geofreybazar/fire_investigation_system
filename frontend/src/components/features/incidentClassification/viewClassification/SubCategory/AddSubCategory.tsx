import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

const AddSubCategory = ({
  setAddingSubcategory,
}: {
  setAddingSubcategory: (value: boolean) => void;
}) => {
  return (
    <Button size='sm' onClick={() => setAddingSubcategory(true)}>
      <Plus className='mr-2 size-4' />
      Add Subcategory
    </Button>
  );
};

export default AddSubCategory;
