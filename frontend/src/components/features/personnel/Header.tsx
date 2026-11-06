import { useState } from "react";
import DialogComponent from "@/components/common/DialogComponent";
import { Users, Plus } from "lucide-react";
import AddPersonnel from "./addPersonnel/AddPersonnel";
import PageHeader from "@/components/common/PageHeader";

const Header = () => {
  const [openAddPersonnel, setOpenAddPersonnel] = useState(false);

  return (
    <PageHeader
      icon={<Users />}
      title='Personnel'
      description='Manage personnel accounts and organizational assignments.'
    >
      <DialogComponent
        open={openAddPersonnel}
        modalOnChange={setOpenAddPersonnel}
        buttonLabel='Add Personnel'
        dialogTitle='Add New Personnel'
        dialogDescription='Enter the personnel details and assign their office.'
        icon={<Plus className='mr-2 h-4 w-4' />}
        classname='max-h-[90vh] overflow-y-auto md:max-w-2xl'
      >
        <AddPersonnel setOpenAddPersonnel={setOpenAddPersonnel} />
      </DialogComponent>
    </PageHeader>
  );
};

export default Header;
