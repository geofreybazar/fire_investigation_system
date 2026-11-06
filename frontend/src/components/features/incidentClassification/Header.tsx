import { useState } from "react";
import DialogComponent from "@/components/common/DialogComponent";
import { Shapes, Plus } from "lucide-react";
import AddClassification from "./addClassification/AddClassification";
import PageHeader from "@/components/common/PageHeader";

const Header = () => {
  const [openAddClassification, setOpenAddClassification] = useState(false);
  const modalOnchange = (isOpen: boolean) => {
    setOpenAddClassification(isOpen);
  };

  return (
    <PageHeader
      icon={<Shapes />}
      title='Incident Classifications'
      description='Manage classifications used to categorize fire incidents.'
    >
      <DialogComponent
        open={openAddClassification}
        modalOnChange={modalOnchange}
        buttonLabel='Add Classification'
        dialogTitle='Add New Classification'
        dialogDescription='Create a new classification for fire incidents.'
        icon={<Plus className='mr-2 h-4 w-4' />}
      >
        <AddClassification
          setOpenAddClassification={setOpenAddClassification}
        />
      </DialogComponent>
    </PageHeader>
  );
};

export default Header;
