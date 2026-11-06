import { FormProvider, useForm } from "react-hook-form";
import useEditUser from "@/hooks/users/useEditUser";
import {
  addNewUserSchema,
  type AddNewUserInput,
  type User,
} from "@/interface/users/users";
import { zodResolver } from "@hookform/resolvers/zod";
import AccountNumber from "../addPersonnel/AccountNumber";
import FirstName from "../addPersonnel/FirstName";
import MiddleName from "../addPersonnel/MiddleName";
import Role from "../addPersonnel/Role";
import Position from "../addPersonnel/Position";
import Rank from "../addPersonnel/Rank";
import LastName from "../addPersonnel/LastName";
import Email from "../addPersonnel/Email";
import Office from "../addPersonnel/Office";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

interface EditFormProps {
  selectedPersonnel: User;
  setSelectedPersonnel: (user: User | undefined) => void;
  setOpenEditUser: (isOpen: boolean) => void;
}

const EditForm = ({
  selectedPersonnel,
  setSelectedPersonnel,
  setOpenEditUser,
}: EditFormProps) => {
  const { editUser, isPending } = useEditUser();

  const methods = useForm<AddNewUserInput>({
    resolver: zodResolver(addNewUserSchema),

    defaultValues: {
      account_number: selectedPersonnel.account_number,
      rank: selectedPersonnel.rank,
      first_name: selectedPersonnel.first_name,
      last_name: selectedPersonnel.last_name,
      middle_name: selectedPersonnel.middle_name,
      email: selectedPersonnel.email,
      role: selectedPersonnel.role,
      officeId: selectedPersonnel.officeId,
      positionId: selectedPersonnel.positionId,
    },
  });

  const onSubmit = async (data: AddNewUserInput) => {
    const dataWithUserId = {
      userId: selectedPersonnel.id,
      ...data,
    };

    await editUser(dataWithUserId);
    setSelectedPersonnel(undefined);
    setOpenEditUser(false);
  };

  return (
    <FormProvider {...methods}>
      <form
        onSubmit={methods.handleSubmit(onSubmit)}
        className='flex w-full flex-col'
      >
        {/* Form Content */}
        <div className='grid gap-6 md:grid-cols-2'>
          {/* Left Column */}
          <div className='space-y-4'>
            <AccountNumber />
            <FirstName />
            <MiddleName />
            <Role />
            <Position />
          </div>

          {/* Right Column */}
          <div className='space-y-4'>
            <Rank />
            <LastName />
            <Email />
            <Office />
          </div>
        </div>

        {/* Footer */}
        <div className='mt-6 flex flex-col-reverse gap-2 border-t pt-5 sm:flex-row sm:justify-end'>
          <Button
            type='button'
            variant='outline'
            onClick={() => setOpenEditUser(false)}
            disabled={isPending}
          >
            Cancel
          </Button>

          <Button type='submit' disabled={isPending}>
            {isPending ? (
              <>
                <Spinner />
                Editing Personnel...
              </>
            ) : (
              "Edit Personnel"
            )}
          </Button>
        </div>
      </form>
    </FormProvider>
  );
};

export default EditForm;
