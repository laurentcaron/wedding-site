import { HttpClient } from '@angular/common/http';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'wedding';
  joiningOptions = [
    {
      fr: 'J\'ai hâte d\'y assister',
      en: 'Can\'t wait to attend',
      id: 'yes'
    },
    {
      fr: 'Je ne pourrais pas y assister',
      en: 'Will sadly miss out',
      id: 'no'
    }
  ];
  foodOptions = [
    {
      fr: 'Boeuf',
      en: 'Meat',
      id: 'beef'
    },
    {
      fr: 'Poisson',
      en: 'Fish',
      id: 'fish'
    },
    {
      fr: 'Végétarien',
      en: 'Vegetarian',
      id: 'veg'
    }
  ];

  guestList: { first: string; last: string; }[] = [];
  lang: string = 'en';
  subscriptions: Subscription[] = [];
  errorMessage: string = '';
  shouldHideForm: boolean = false;

  form: FormGroup = this.fb.group({
    joining: this.fb.group({}),
    diner: this.fb.group({}),
    restrictions: this.fb.group({})
  });

  constructor(
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private http: HttpClient
  ) {}

  public ngOnInit(): void {
    this.subscriptions.push(this.route.queryParams.subscribe(params => {
      if (params) {
        if (params['guests']) {
          const guests = (params['guests'] as string).split('@');
          guests.forEach(guest => {
            const fullName = guest.split('_');
            this.guestList.push({
              first: fullName[0],
              last: fullName[1]
            });
          });

          for (const guest of this.guestList) {
            (this.form.get('joining') as FormGroup).addControl(guest.first, new FormControl('', Validators.required));
            (this.form.get('diner') as FormGroup).addControl(guest.first, new FormControl(''));
            (this.form.get('restrictions') as FormGroup).addControl(guest.first, new FormControl(''));
          }
        }

        if (params['lang']) {
          this.lang = params['lang'];
        }
      }
    }));

    const storedValue = localStorage.getItem('shouldHideForm');
    if (storedValue) {
      this.shouldHideForm = JSON.parse(storedValue);
    }
  }

  public shouldDisplayFoodSection(guest: string) {
    return (this.form.get(`joining.${guest}`) as FormControl).value === 'yes';
  }

  public submit() {
    if (this.form.invalid) {
      this.errorMessage = this.lang === 'fr' ?
        'Veuillez compléter le formulaire' :
        'Please complete the form';
      return;
    }

    for (const guest of this.guestList) {
      if ((this.form.get(`joining.${guest.first}`) as FormControl).value === 'yes') {
        if (!(this.form.get(`diner.${guest.first}`) as FormControl).value) {
          this.errorMessage = this.lang === 'fr' ?
            'Veuillez compléter le formulaire' :
            'Please complete the form';
          return;
        }
      }
    }

    const result: any[] = [];
    for (const guest of this.guestList) {
      result.push({
        first: guest.first,
        last: guest.last,
        joining: (this.form.get(`joining.${guest.first}`) as FormControl).value,
        diner: (this.form.get(`diner.${guest.first}`) as FormControl).value,
        restriction: (this.form.get(`restrictions.${guest.first}`) as FormControl).value
      });
    }

    // Send data
    console.log(result);
    try {
      this.http.post('https://us-central1-lealaurentwedding.cloudfunctions.net/addGuests', {
        guests: result
      }).subscribe((result) => {
        localStorage.setItem('shouldHideForm', 'true');
        this.shouldHideForm = true;
      });
    } catch (err) {
      console.error(err);
    }
  }

  public ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }
}
