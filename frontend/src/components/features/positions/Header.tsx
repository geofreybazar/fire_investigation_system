import { useState } from "react";
import DialogComponent from "@/components/common/DialogComponent";
import { BriefcaseBusiness, Plus } from "lucide-react";
import AddPosition from "./addPosition/AddPosition";
import PageHeader from "@/components/common/PageHeader";

const Header = () => {
  const [openAddOffice, setOpenAddOffice] = useState(false);
  const modalOnchange = (isOpen: boolean) => {
    setOpenAddOffice(isOpen);
  };

  return (
    <PageHeader
      icon={<BriefcaseBusiness />}
      title='Positions'
      description='Manage personnel positions and their assignments.'
    >
      <DialogComponent
        open={openAddOffice}
        modalOnChange={modalOnchange}
        buttonLabel='Add Position'
        dialogTitle='Add New Position'
        dialogDescription='Create a new position for personnel assignment.'
        icon={<Plus className='mr-2 h-4 w-4' />}
      >
        <AddPosition setOpenAddOffice={setOpenAddOffice} />
      </DialogComponent>
    </PageHeader>
  );
};

export default Header;
