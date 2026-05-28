import type { Example } from "./index";

export const email: Example = {
  id: "email",
  label: "📧 Email",
  hint: "Real-world template with conditionals, loops, and filters.",
  template: `Subject: Your order #{{ order.id }} is confirmed

Hi {{ customer.name }},

Thanks for your order! Here's your summary:

{% for item in order.items %}
  {{ item.qty }}× {{ item.name }} — \${{ item.price }}
{% endfor %}

Subtotal: \${{ order.subtotal }}
{% if order.discount > 0 %}
Discount: -\${{ order.discount }}
{% endif %}
Total: \${{ order.total }}

— The {{ company }} Team`,
  dataJson: `{
  "customer": { "name": "Alice" },
  "company": "Acme",
  "order": {
    "id": "10234",
    "items": [
      { "name": "Notebook", "qty": 2, "price": 12 },
      { "name": "Pen", "qty": 5, "price": 3 },
      { "name": "机械键盘", "qty": 1, "price": 699 }
    ],
    "subtotal": 39,
    "discount": 5,
    "total": 34
  }
}`,
  outputMode: "text",
};
