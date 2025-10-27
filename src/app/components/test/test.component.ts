import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-test',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="p-8">
      <h1 class="text-2xl font-bold text-blue-600">BracketAce Test Page</h1>
      <p class="mt-4">If you can see this, the Angular app is loading correctly!</p>
      <div class="mt-4 p-4 bg-green-100 rounded">
        <p class="text-green-800">✅ Angular application is working</p>
        <p class="text-green-800">✅ Routing is functional</p>
        <p class="text-green-800">✅ Components are rendering</p>
      </div>
    </div>
  `
})
export class TestComponent {}