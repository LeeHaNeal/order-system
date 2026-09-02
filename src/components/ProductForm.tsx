import type { Product } from "@prisma/client";

export default function ProductForm({
  action,
  product,
  submitLabel,
}: {
  action: (formData: FormData) => void | Promise<void>;
  product?: Product;
  submitLabel: string;
}) {
  return (
    <form action={action} className="card space-y-4 p-6">
      {product && <input type="hidden" name="productId" value={product.id} />}

      <div>
        <label className="label" htmlFor="name">
          상품명
        </label>
        <input id="name" name="name" required defaultValue={product?.name} className="input" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label" htmlFor="category">
            카테고리
          </label>
          <input
            id="category"
            name="category"
            required
            defaultValue={product?.category ?? "기타"}
            className="input"
          />
        </div>
        <div>
          <label className="label" htmlFor="price">
            가격 (원)
          </label>
          <input
            id="price"
            name="price"
            type="number"
            min={0}
            required
            defaultValue={product?.price}
            className="input"
          />
        </div>
      </div>

      <div>
        <label className="label" htmlFor="stock">
          재고 수량
        </label>
        <input
          id="stock"
          name="stock"
          type="number"
          min={0}
          required
          defaultValue={product?.stock ?? 0}
          className="input"
        />
      </div>

      <div>
        <label className="label">상품 이미지</label>
        {product?.imageUrl && (
          <div className="mb-2 flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={product.imageUrl}
              alt=""
              className="h-16 w-16 rounded-md border border-gray-200 object-cover"
            />
            <span className="text-xs text-gray-400">현재 등록된 이미지</span>
          </div>
        )}
        <input
          id="imageFile"
          name="imageFile"
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          className="input file:mr-3 file:rounded-md file:border-0 file:bg-brand-600 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-white hover:file:bg-black"
        />
        <p className="mt-1 text-xs text-gray-400">
          파일을 선택하면 아래 이미지 URL 대신 업로드한 이미지가 사용됩니다. (jpg/png/webp/gif, 5MB 이하)
        </p>
        <input
          id="imageUrl"
          name="imageUrl"
          defaultValue={product?.imageUrl?.startsWith("/uploads/") ? "" : product?.imageUrl ?? ""}
          placeholder="또는 이미지 URL을 직접 입력하세요 (https://...)"
          className="input mt-2"
        />
      </div>

      <div>
        <label className="label" htmlFor="description">
          상품 설명
        </label>
        <textarea
          id="description"
          name="description"
          rows={4}
          defaultValue={product?.description}
          className="input"
        />
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="isActive"
          defaultChecked={product?.isActive ?? true}
          className="h-4 w-4 rounded border-gray-300"
        />
        판매중 (체크 해제 시 상품 목록에 노출되지 않습니다)
      </label>

      <button type="submit" className="btn-primary">
        {submitLabel}
      </button>
    </form>
  );
}
