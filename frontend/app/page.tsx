import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  const plants = [
    { id: 1, name: "第1プラント" },
    { id: 2, name: "第2プラント" },
    { id: 3, name: "第3プラント" },
    { id: 4, name: "第4プラント" },
    { id: 5, name: "第5プラント" },
  ];

  return (
    <main className="p-10">
      <h1 className="text-3xl font-bold mb-6">
        プラント一覧
      </h1>

      <table className="w-full border border-gray-300">
        <thead className="bg-gray-100">
          <tr>
            <th className="border border-gray-300 px-4 py-2 text-left">
              プラント名
            </th>
            <th className="border border-gray-300 px-4 py-2 text-center">
              操作
            </th>
          </tr>
        </thead>
        <tbody>
          {plants.map((plant) => (
            <tr key={plant.id} className="hover:bg-gray-50">
              <td className="border border-gray-300 px-4 py-2">
                {plant.name}
              </td>
              <td className="border border-gray-300 px-4 py-2 text-center">
                <Link href="/dashboard">
                  <Button size="sm">
                    詳細
                  </Button>
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
