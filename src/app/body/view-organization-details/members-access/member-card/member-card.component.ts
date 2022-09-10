import { StickyDirection } from '@angular/cdk/table';
import { Component, Input, OnInit } from '@angular/core';
import { AngularFireFunctions } from '@angular/fire/compat/functions';
import { MemberData } from 'src/app/Interface/UserInterface';
import { BackendService } from 'src/app/services/backend/backend.service';
import { ErrorHandlerService } from 'src/app/services/error-handler/error-handler.service';
@Component({
  selector: 'app-member-card',
  templateUrl: './member-card.component.html',
  styleUrls: ['./member-card.component.css']
})
export class MemberCardComponent implements OnInit {
  @Input('member') member: MemberData
  componentName: string = "Member Card Component"
  memberRole: string
  constructor(private backendService: BackendService, public errorHandlerService: ErrorHandlerService, private functions: AngularFireFunctions) { }

  ngOnInit(): void {
    this.checkMemberRole()
  }
  checkMemberRole(){
    if(this.member.IsAdmin==true){
      this.memberRole="Admin";
    }
    else if(this.member.IsAdmin== false && this.member.TeamManager == true){
      this.memberRole = "Team Manager";
    }
    else{
      this.memberRole= "Member";
    }
  }
  changeMemberRole(role: string){
    console.log(role);
    if(this.memberRole!=role){
      const orgDomain = this.backendService.organizationDetails.OrganizationDomain;
      let isAdmin: boolean
      let teamManager: boolean

      if(role=='Admin'){
        isAdmin = true;
        teamManager = true;
      }
      else if(role=='Team Manager'){
        isAdmin = false;
        teamManager = true;
      }
      else {
        isAdmin = false;
        teamManager = false;
      }
      this.memberRole = role;
      const callable = this.functions.httpsCallable("organization/changeMemberRole");
       callable({OrgDomain: orgDomain, Email: this.member.Email, IsAdmin: isAdmin, TeamManager: teamManager}).subscribe({
        next: (data) => {
          console.log("Member Role Edited succesfully");
        },
        error: (error) => {
          this.errorHandlerService.showError = true;
          this.errorHandlerService.getErrorCode(this.componentName, "InternalError","Api");
          console.error("Error", error);
        },
        complete: () => console.info('Successfully edited Member Role')
    });
    }
  }
}
