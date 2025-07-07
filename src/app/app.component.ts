import { HttpClient } from '@angular/common/http';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';

interface Exists {
  exists: boolean;
}

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
      en: 'Yes, I\'m excited to attend',
      id: 'yes'
    },
    {
      fr: 'Je ne pourrais pas y assister',
      en: 'No, I will sadly miss out',
      id: 'no'
    }
  ];
  foodOptions = [
    {
      fr: 'Filet de boeuf AAA',
      en: 'AAA Beef Tenderloin',
      id: 'beef'
    },
    {
      fr: 'Steak de saumon fumé sur bois d\érable',
      en: 'Smoked Salmon Steak on Maple Wood',
      id: 'fish'
    },
    {
      fr: 'Filet de porc du Québec',
      en: 'Slow-cooked Quebec Pork Tenderloin',
      id: 'pork'
    }
  ];

  guestList: { first: string; last: string; }[] = [];
  lang: string = 'en';
  subscriptions: Subscription[] = [];
  errorMessage: string = '';
  shouldHideForm: boolean = false;
  shouldShowGotcha: boolean = false;
  loading: boolean = false;

  form: FormGroup = this.fb.group({
    joining: this.fb.group({}),
    diner: this.fb.group({}),
    restrictions: this.fb.group({})
  });

  constructor(
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private http: HttpClient
  ) { }

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

          this.namesExists()
          this.guestsExists();

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
  }

  private namesExists() {
    this.subscriptions.push(this.http.post<Exists>('https://us-central1-lealaurentwedding.cloudfunctions.net/namesExists', {
      names: this.guestList
    }).subscribe((result: Exists) => {
      if (!result.exists) {
        this.shouldShowGotcha = true;
      }
    }));
  }

  private async guestsExists() {
    this.subscriptions.push(this.http.post<Exists>('https://us-central1-lealaurentwedding.cloudfunctions.net/guestsExists', {
      guests: this.guestList
    }).subscribe((result: Exists) => {
      if (result.exists) {
        this.shouldHideForm = true;
      }
    }));
  }

  public shouldDisplayFoodSection(guest: string) {
    return (this.form.get(`joining.${guest}`) as FormControl).value === 'yes';
  }

  public addToCalendar() {
    const start = new Date(2023, 8, 19)
    const end = new Date(2023, 8, 20)
    const final_date = this.format_date(start) + "/" + this.format_date(end);
    const name = this.lang === 'fr' ? "Marriage Lea et Laurent" : "Wedding Lea and Laurent";
    const description = this.lang === 'fr' ?
      `Joignez-vous à nous pour notre marriage. %0A%0ALa cérémonie débute à 15:00 %0AChapelle Notre-Dame-du-Sacré-Coeur https://goo.gl/maps/dwtnANP8K7yoJmeB8 %0A426 Rue Saint-Sulpice, Montreal, QC, Canada %0A%0AReception starts at 5:15 PM %0AHotel InterContinental https://goo.gl/maps/pksb2dojYLVv8jGP9 %0A360 Rue Saint-Antoine O, Montreal, QC, Canada` :
      `Join us as we walk down the aisle. %0A%0ACeremony starts at 3:00 PM %0AChapelle Notre-Dame-du-Sacré-Coeur https://goo.gl/maps/dwtnANP8K7yoJmeB8 %0A426 Rue Saint-Sulpice, Montreal, QC, Canada %0A%0AReception starts at 5:15 PM %0AHotel InterContinental https://goo.gl/maps/pksb2dojYLVv8jGP9 %0A360 Rue Saint-Antoine O, Montreal, QC, Canada %0A`;
    const loc = '426 St Sulpice St, Montreal, Quebec H2Y 2V5';
    const href = "https://www.google.com/calendar/render?action=TEMPLATE&text="+ name +"&dates="+ final_date +"&details="+ description +"&location="+ loc +"&sf=true&output=xml";
    window.open(href,'_blank');
  }
  
  private zero_pad2(num: number) {
    if(num < 10) return "0" + num;
      return num;
  }

  private format_date(date: Date) {
    var day = date.getDate();
    var monthIndex = date.getMonth();
    var year = date.getFullYear();
    
    let formatted_date;
    formatted_date = ("" + year) + this.zero_pad2(monthIndex) + this.zero_pad2(day);
    
    return formatted_date;
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

    try {
      this.loading = true;
      this.subscriptions.push(this.http.post('https://us-central1-lealaurentwedding.cloudfunctions.net/addGuests', {
        guests: result
      }).subscribe(() => {
        localStorage.setItem('shouldHideForm', 'true');
        this.shouldHideForm = true;
        this.loading = false;
      }));
    } catch (err) {
      console.error('An error occurred while adding the guests data', err);
      this.loading = false;
    }
  }

  public ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }
}
