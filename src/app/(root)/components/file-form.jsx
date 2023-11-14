"use client";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

const { default: FileUpload } = require("@/components/ui/file-upload");
const {
  FormMessage,
  FormControl,
  FormLabel,
  FormItem,
  FormField,
  Form,
} = require("@/components/ui/form");

const formSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  thumbnail: z.string().min(1),
  images: z.object({ url: z.string() }).array(),
  tokopedia: z.string().min(0),
  link: z.string().min(1),
  isPublic: z.boolean().default(false).optional(),
});

export const FileForm = ({ initialData, categories, materials }) => {
  const params = useParams();
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const title = initialData ? "Edit file" : "Create file";
  const description = initialData ? "Edit file." : "Add a new file";
  const toastMessage = initialData ? "File updated." : "File created.";
  const action = initialData ? "Save changes" : "Upload";

  const defaultValues = initialData
    ? {
        ...initialData,
        price: parseFloat(String(initialData?.price)),
      }
    : {
        name: "",
        description: "",
        thumbnail: "",
        files: [],
        categoryId: "",
        link: "",
        isPublic: false,
      };

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  const onSubmit = async (data) => {
    try {
      // console.log("form data:", data);
      setLoading(true);
      if (initialData) {
        await axios.patch(`/api/file/${params.fileId}`, data);
      } else {
        await axios.post(`/api/file`, data);
      }
      router.refresh();
      router.push(`/dashboard/files`);
      toast.success(toastMessage);
    } catch (error) {
      toast.error("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const onDelete = async () => {
    try {
      setLoading(true);
      await axios.delete(`/api/file/${params.fileId}`);
      router.refresh();
      router.push(`/files`);
      toast.success("file deleted.");
    } catch (error) {
      toast.error("Something went wrong.");
    } finally {
      setLoading(false);
      setOpen(false);
    }
  };

  return (
    <>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex-1 flex flex-col grow justify-center items-center w-full h-full"
        >
          <FormField
            control={form.control}
            name="files"
            render={({ field }) => (
              <FormControl>
                <FileUpload
                  value={field.value ? [field.value] : []}
                  disabled={loading}
                  onChange={(filedata) => {
                    field.onChange(filedata);
                    console.log("form pass: ", filedata);
                  }}
                  onRemove={() => field.onChange([])}
                />
              </FormControl>
            )}
          />
        </form>
      </Form>
    </>
  );
};
