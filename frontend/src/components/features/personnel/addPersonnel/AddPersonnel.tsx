import useAddNewUser from "@/hooks/users/useAddNewUser";

import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  type AddNewUserInput,
  addNewUserSchema,
} from "@/interface/users/users";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

import AccountNumber from "./AccountNumber";
import Rank from "./Rank";
import FirstName from "./FirstName";
import LastName from "./LastName";
import MiddleName from "./MiddleName";
import Email from "./Email";
import Role from "./Role";
import Office from "./Office";
import Position from "./Position";

interface AddPersonnelProps {
  setOpenAddPersonnel: (isOpen: boolean) => void;
}

const AddPersonnel = ({ setOpenAddPersonnel }: AddPersonnelProps) => {
  const { addUser, isPending } = useAddNewUser();

  const methods = useForm<AddNewUserInput>({
    resolver: zodResolver(addNewUserSchema),

    defaultValues: {
      account_number: "",
      rank: undefined,
      first_name: "",
      last_name: "",
      middle_name: "",
      email: "",
      role: undefined,
      officeId: "",
      positionId: "",
    },
  });

  const onSubmit = async (data: AddNewUserInput) => {
    await addUser(data);

    setOpenAddPersonnel(false);
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
            onClick={() => setOpenAddPersonnel(false)}
            disabled={isPending}
          >
            Cancel
          </Button>

          <Button type='submit' disabled={isPending}>
            {isPending ? (
              <>
                <Spinner />
                Adding Personnel...
              </>
            ) : (
              "Add Personnel"
            )}
          </Button>
        </div>
      </form>
    </FormProvider>
  );
};

export default AddPersonnel;
