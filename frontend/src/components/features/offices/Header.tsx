import { useState } from "react";
import DialogComponent from "@/components/common/DialogComponent";
import { Building2, Plus } from "lucide-react";
import AddOffice from "./addOffice/AddOffice";
import PageHeader from "@/components/common/PageHeader";

const Header = () => {
  const [openAddOffice, setOpenAddOffice] = useState(false);
  const modalOnchange = (isOpen: boolean) => {
    setOpenAddOffice(isOpen);
  };

  return (
    <PageHeader
      icon={<Building2 />}
      title='Offices'
      description='Manage organizational offices and their hierarchy.'
    >
      <DialogComponent
        open={openAddOffice}
        modalOnChange={modalOnchange}
        buttonLabel='Add Office'
        dialogTitle='Add New Office'
        dialogDescription='Create a new office and assign it to the appropriate office hierarchy.'
        icon={<Plus className='mr-2 h-4 w-4' />}
      >
        <AddOffice setOpenAddOffice={setOpenAddOffice} />
      </DialogComponent>
    </PageHeader>
  );
};

export default Header;
