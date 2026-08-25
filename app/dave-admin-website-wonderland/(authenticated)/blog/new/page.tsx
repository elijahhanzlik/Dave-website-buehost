import BlogPostForm from "@/components/admin/BlogPostForm";
import { PageHeader } from "@/components/admin/ui";

export default function NewBlogPostPage() {
  return (
    <div>
      <PageHeader
        eyebrow="Blog"
        title="Write a post"
        subtitle="Write it now, publish it now, or leave it as a draft only you can see."
      />
      <BlogPostForm />
    </div>
  );
}
