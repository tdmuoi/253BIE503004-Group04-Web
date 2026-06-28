import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

interface CartItem {
  name: string;
  author: string;
  price: number;
  quantity: number;
  img: string;
}

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cart.html',
  styleUrl: './cart.css',
})
export class Cart {
  private readonly router = inject(Router);

  products: CartItem[] = [
    {
      name: 'Rừng Na Uy',
      author: 'Haruki Murakami',
      price: 115000,
      quantity: 1,
      img: 'https://upload.wikimedia.org/wikipedia/en/a/a2/NorwegianWood.jpg'
    },
    {
      name: 'Đắc nhân tâm',
      author: 'Dale Carnegie',
      price: 85000,
      quantity: 1,
      img: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/37/How_to_Win_Friends_and_Influence_People.jpg/220px-How_to_Win_Friends_and_Influence_People.jpg'
    }
  ];

  shippingPrice: number = 30000;

  get subtotal(): number {
    return this.products.reduce((acc, curr) => acc + curr.price * curr.quantity, 0);
  }

  get totalPrice(): number {
    return this.subtotal + this.shippingPrice;
  }

  increaseQty(index: number) {
    this.products[index].quantity += 1;
  }

  decreaseQty(index: number) {
    if (this.products[index].quantity > 1) {
      this.products[index].quantity -= 1;
    }
  }

  deleteItem(index: number) {
    this.products.splice(index, 1);
  }

  onCheckout() {
    void this.router.navigate(['/dat-hang']);
  }
}
