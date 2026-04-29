import axios from "axios";

export interface ItemResponse {
  itemId: string;
  name: string;
  retail1: number;
}

export const getItem = async (itemId: string): Promise<ItemResponse> => {
  const response = await axios.get("/api/getItem", {
    params: { itemId },
  });
  return response.data;
};

export const updateItem = async (itemId: string, name: string) => {
  const payload = [
    {
      action: "U",
      itemId,
      name,
      receiptAlias: name,
      nonReturnable: true,
    },
  ];
  const response = await axios.post("/api/updateItem", payload);
  return response.data;
};

export const updatePrice = async (itemId: string, price: number) => {
  const payload = [
    {
      itemId,
      zoneId: "Primary Zone",
      retail1: price.toString(),
      quantityOnly1: true,
      divider: 1,
    },
  ];
  const response = await axios.post("/api/updatePrice", payload);
  return response.data;
};
