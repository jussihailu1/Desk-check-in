import { Component } from '@angular/core';
import { BarcodeScanner } from '@ionic-native/barcode-scanner/ngx';
import { AndroidPermissions } from '@ionic-native/android-permissions/ngx';
import { Observable } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { LoadingController } from '@ionic/angular';
import { Platform } from '@ionic/angular';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage {
  email: string = "test@offizzer.com";
  deskId: any = 1;

  checkedIn: boolean;
  platformIsWeb: boolean;

  data: Observable<any>;
  base_URL: string = 'http://192.168.0.167:5678/webhook/';
  checkInURL: string = 'check-in';
  checkOutURL: string = 'check-out';
  checkInStatusURL: string = 'check-in-status';

  ERROR;

  constructor(
    private barcodeScanner: BarcodeScanner,
    private androidPermissions: AndroidPermissions,
    private httpClient: HttpClient,
    private loadingController: LoadingController,
    private platform: Platform
  ) {
  }

  async presentLoading() {
    let loading = await this.loadingController.getTop();
    if (loading == undefined) {
      loading = await this.loadingController.create({
        message: 'Please wait...',
      });
    }

    return await loading.present();
  }

  async ngOnInit() {
    this.platformIsWeb = this.platform.is("mobileweb");
    await this.presentLoading();
    this.loadCheckInStatus();
  }

  async mobileScan() {
    await this.presentLoading();
    this.androidPermissions.checkPermission(this.androidPermissions.PERMISSION.CAMERA).then(
      (result) => {
        console.log('Has permission?', result.hasPermission);
        this.barcodeScanner.scan().then(data => {
          this.deskId = data.text;
          this.CheckIn();
        }).catch(err => {
          console.log('Error', err);
        });
      },
      async (err) => {
        console.log('Error', err)

        this.loadingController.dismiss();
        let loading = await this.loadingController.create({
          message: "Function not available on web",
          duration: 2000
        })
        loading.present();
        // this.androidPermissions.requestPermission(this.androidPermissions.PERMISSION.CAMERA);
      }
    );
  }

  async CheckIn() {
    await this.presentLoading();
    const body = {
      deskId: this.deskId,
      userId: this.email
    };
    const url = this.base_URL + this.checkInURL;
    const options = {
      params: body
    };
    console.log(body);
    this.data = this.httpClient.get(url, options);
    this.data.subscribe(data => {
      console.log('my data: ', data);
      this.setCheckInStatus(true);
    })
  }

  async CheckOut() {
    await this.presentLoading();
    const body = {
      userId: this.email
    };
    const url = this.base_URL + this.checkOutURL;
    const options = {
      params: body
    };
    console.log(body);
    this.data = this.httpClient.get(url, options);
    this.data.subscribe(data => {
      console.log('my data: ', data);
      this.setCheckInStatus(false);
    })
  }

  async loadCheckInStatus() {
    await this.presentLoading();
    const body = {
      userId: this.email
    };
    const url = this.base_URL + this.checkInStatusURL;
    const options = {
      params: body
    };
    console.log(body);
    this.data = this.httpClient.get(url, options);
    this.data.subscribe(data => {
      console.log('data: ', data);
      this.setCheckInStatus(Boolean(data.exists));
    }, err => {
      console.log(err)
      this.ERROR = err.message;
      this.loadingController.dismiss();
    })
  }

  async setCheckInStatus(checkedIn: boolean) {
    this.checkedIn = checkedIn;
    this.loadingController.dismiss();
  }
}
