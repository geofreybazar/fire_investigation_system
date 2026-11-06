import { useTheme } from "@/components/app/providers/ThemeProvider";
import { Monitor, Moon, Sun } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

const Apperance = () => {
  const { setTheme } = useTheme();
  return (
    <Card>
      <CardHeader>
        <div className='flex items-center gap-3'>
          <div className='rounded-md bg-muted p-2'>
            <Monitor className='size-4 text-muted-foreground' />
          </div>

          <div>
            <CardTitle className='text-base'>Appearance</CardTitle>

            <CardDescription>
              Customize how FIIS looks on your device.
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className='space-y-5'>
        <div className='flex items-center justify-between gap-4'>
          <div>
            <Label>Theme</Label>

            <p className='text-sm text-muted-foreground'>
              Choose your preferred interface theme.
            </p>
          </div>

          <div className='flex gap-1 rounded-md border p-1'>
            <Button
              variant='ghost'
              size='sm'
              className='h-8 px-2'
              onClick={() => setTheme("light")}
            >
              <Sun className='size-4' />
              <span className='sr-only'>Light</span>
            </Button>

            <Button
              variant='secondary'
              size='sm'
              className='h-8 px-2'
              onClick={() => setTheme("dark")}
            >
              <Moon className='size-4' />
              <span className='sr-only'>Dark</span>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default Apperance;
